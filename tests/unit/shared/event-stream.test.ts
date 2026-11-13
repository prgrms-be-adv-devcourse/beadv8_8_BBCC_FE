import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getErrorMessage,
  getErrorStatus,
  getEventStream,
  openEventStream,
  obj,
  oneOf,
  str,
  useApiFlowLog,
} from '@/shared/api'

// 공통 클라이언트로 SSE를 받는다: fetch가 text/event-stream 본문을 흘려보내고, 흐름 기록에 이벤트 순서 · 계약 불일치가 남는다.
// Node의 fetch는 상대 주소를 받지 않아 API 주소를 절대 주소로 둔다 (클라이언트가 불러올 때 읽으므로 import보다 먼저)
vi.hoisted(() => vi.stubEnv('VITE_API_BASE_URL', 'http://localhost'))

const PATH = '/__test/streams/1'
const shape = obj({ source: oneOf(['AI', 'RULE']), note: str })

type TestEvent = { event: string; data: unknown; delayMs?: number }

// 서버처럼 이벤트를 하나씩 흘려보낸다. 요청을 끊으면(signal) 닫는다
function eventStream(events: TestEvent[], signal: AbortSignal): Response {
  const encoder = new TextEncoder()
  let index = 0
  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const next = events[index++]
      if (next?.delayMs) await new Promise((resolve) => setTimeout(resolve, next.delayMs))
      if (!next || signal.aborted) {
        controller.close()
        return
      }
      controller.enqueue(
        encoder.encode(`event: ${next.event}\ndata: ${JSON.stringify(next.data)}\n\n`),
      )
    },
  })
  return new Response(body, { status: 200, headers: { 'content-type': 'text/event-stream' } })
}

function respond(request: Request): Response {
  const testCase = new URL(request.url).searchParams.get('case')
  if (testCase === 'missing') {
    return new Response(
      JSON.stringify({
        type: 'about:blank',
        title: '자녀를 찾을 수 없습니다',
        status: 404,
        detail: '자녀를 다시 확인해 주세요.',
        instance: PATH,
      }),
      { status: 404, headers: { 'content-type': 'application/problem+json' } },
    )
  }
  if (testCase === 'live') {
    return eventStream(
      [
        { event: 'rule', data: { source: 'RULE', note: '첫째' } },
        { event: 'ai', data: { source: 'AI', note: '둘째' }, delayMs: 30 },
      ],
      request.signal,
    )
  }
  if (testCase === 'broken') {
    return new Response('event: rule\ndata: {깨진 JSON\n\n', {
      status: 200,
      headers: { 'content-type': 'text/event-stream' },
    })
  }
  if (testCase === 'rule-only') {
    return eventStream([{ event: 'rule', data: { source: 'RULE', note: '규칙' } }], request.signal)
  }
  return eventStream(
    [
      { event: 'rule', data: { source: 'RULE', note: '규칙' } },
      { event: 'ai', data: { source: 'AI', note: 7 } },
    ],
    request.signal,
  )
}

function stubFetch() {
  useApiFlowLog.getState().clear()
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: Request | string) =>
      respond(typeof input === 'string' ? new Request(input) : input),
    ),
  )
}

const lastLog = () => useApiFlowLog.getState().logs.at(-1)

describe('getEventStream: 공통 클라이언트로 text/event-stream 받기', () => {
  beforeEach(stubFetch)
  afterEach(() => vi.unstubAllGlobals())

  it('이벤트를 순서대로 JSON으로 받고, 흐름 기록에 이벤트 순서와 마지막 데이터를 남긴다', async () => {
    const events = await getEventStream(PATH, { params: { productId: '1' }, shape })

    expect(events).toEqual([
      { event: 'rule', data: { source: 'RULE', note: '규칙' } },
      { event: 'ai', data: { source: 'AI', note: 7 } },
    ])
    expect(lastLog()).toMatchObject({
      method: 'GET',
      path: PATH,
      status: 200,
      responseBody: { events: ['rule', 'ai'], data: { source: 'AI', note: 7 } },
    })
  })

  it('이벤트 데이터가 계약 모양과 다르면 그 호출 기록에 불일치를 붙인다', async () => {
    await getEventStream(PATH, { shape })

    expect(lastLog()?.contractIssues).toEqual([
      expect.objectContaining({ path: 'note', expected: 'string', actual: 'number (7)' }),
    ])
  })

  it('규칙 결과만 오고 닫히면 그 이벤트 하나를 돌려준다', async () => {
    const events = await getEventStream(PATH, { params: { case: 'rule-only' }, shape })

    expect(events.map((item) => item.event)).toEqual(['rule'])
    expect(lastLog()?.contractIssues).toEqual([])
  })

  // 끊긴 스트림과 달리 받은 이벤트를 읽다 난 오류는 그때까지 받은 것이 있어도 삼키지 않는다
  it.each<[string, Parameters<typeof getEventStream>[1], string | RegExp]>([
    ['data가 JSON이 아니면', { params: { case: 'broken' }, shape }, /JSON/],
    [
      'onEvent가 던지면',
      {
        params: { case: 'live' },
        shape,
        onEvent: () => {
          throw new Error('캐시를 고치지 못했어요')
        },
      },
      '캐시를 고치지 못했어요',
    ],
  ])('%s 그 오류를 던진다', async (_, options, expected) => {
    await expect(getEventStream(PATH, options)).rejects.toThrow(expected)
  })

  it('이벤트가 올 때마다 onEvent로 먼저 넘기고, 그 순간 흐름 기록에 지금까지 받은 이벤트를 남긴다', async () => {
    const seen: { event: string; at: number; logged: unknown }[] = []

    await getEventStream(PATH, {
      params: { case: 'live' },
      shape,
      onEvent: (item) =>
        seen.push({ event: item.event, at: performance.now(), logged: lastLog()?.responseBody }),
    })
    const closedAt = performance.now()

    expect(seen).toEqual([
      {
        event: 'rule',
        at: expect.any(Number),
        logged: { events: ['rule'], data: { source: 'RULE', note: '첫째' } },
      },
      {
        event: 'ai',
        at: expect.any(Number),
        logged: { events: ['rule', 'ai'], data: { source: 'AI', note: '둘째' } },
      },
    ])
    // 규칙 결과는 AI 답(30ms 뒤)을 기다리지 않고 넘어온다
    expect(closedAt - seen[0]!.at).toBeGreaterThanOrEqual(20)
  })

  it('스트림을 열기 전 오류(ProblemDetail)는 상태 코드와 detail을 그대로 읽을 수 있다', async () => {
    const failed = await getEventStream(PATH, { params: { case: 'missing' }, shape }).catch(
      (error: unknown) => error,
    )

    expect(getErrorStatus(failed)).toBe(404)
    expect(getErrorMessage(failed)).toBe('자녀를 다시 확인해 주세요.')
    expect(lastLog()).toMatchObject({
      status: 404,
      responseBody: { detail: '자녀를 다시 확인해 주세요.' },
    })
  })
})

describe('openEventStream: 열린 스트림을 읽으며 이벤트마다 부르기', () => {
  beforeEach(stubFetch)
  afterEach(() => vi.unstubAllGlobals())

  it('이벤트가 올 때마다 data를 JSON으로 넘기고, 서버가 닫으면 끝난다. 흐름 기록은 한 건에 마지막 이벤트만 남긴다', async () => {
    const received: unknown[] = []

    await openEventStream(PATH, {
      params: { case: 'live' },
      signal: new AbortController().signal,
      shape,
      onEvent: (item) => received.push(item),
    })

    expect(received).toEqual([
      { event: 'rule', data: { source: 'RULE', note: '첫째' } },
      { event: 'ai', data: { source: 'AI', note: '둘째' } },
    ])
    expect(useApiFlowLog.getState().logs).toHaveLength(1)
    expect(lastLog()).toMatchObject({
      status: 200,
      responseBody: { event: 'ai', data: { source: 'AI', note: '둘째' } },
    })
  })

  it('끊으면(abort) 그 뒤 이벤트는 넘기지 않는다', async () => {
    const controller = new AbortController()
    const received: unknown[] = []

    await openEventStream(PATH, {
      params: { case: 'live' },
      signal: controller.signal,
      shape,
      onEvent: (item) => {
        received.push(item)
        controller.abort()
      },
    }).catch(() => {})

    expect(received).toHaveLength(1)
  })

  it('스트림을 열기 전 오류는 상태 코드를 읽을 수 있게 던진다', async () => {
    const failed = await openEventStream(PATH, {
      params: { case: 'missing' },
      signal: new AbortController().signal,
      shape,
      onEvent: () => {},
    }).catch((error: unknown) => error)

    expect(getErrorStatus(failed)).toBe(404)
  })
})
