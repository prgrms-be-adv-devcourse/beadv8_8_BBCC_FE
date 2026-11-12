import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getErrorMessage,
  getErrorStatus,
  getEventStream,
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

function eventStream(events: { event: string; data: unknown }[]): Response {
  const encoder = new TextEncoder()
  let index = 0
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      const next = events[index++]
      if (!next) {
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

function respond(url: URL): Response {
  const testCase = url.searchParams.get('case')
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
  if (testCase === 'rule-only') {
    return eventStream([{ event: 'rule', data: { source: 'RULE', note: '규칙' } }])
  }
  return eventStream([
    { event: 'rule', data: { source: 'RULE', note: '규칙' } },
    { event: 'ai', data: { source: 'AI', note: 7 } },
  ])
}

const lastLog = () => useApiFlowLog.getState().logs.at(-1)

describe('getEventStream: 공통 클라이언트로 text/event-stream 받기', () => {
  beforeEach(() => {
    useApiFlowLog.getState().clear()
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: Request | string) =>
        respond(new URL(typeof input === 'string' ? input : input.url)),
      ),
    )
  })
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
