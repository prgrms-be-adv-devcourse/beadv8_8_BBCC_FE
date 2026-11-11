import { beforeEach, describe, expect, it } from 'vitest'
import {
  getErrorMessage,
  getErrorStatus,
  getEventStream,
  obj,
  oneOf,
  registerMockHandlers,
  str,
  useApiFlowLog,
} from '@/shared/api'

// 공통 클라이언트로 SSE를 받는다: 목 어댑터가 이벤트를 흘려보내고, 흐름 기록에 이벤트 순서 · 계약 불일치가 남는다
const PATH = '/recommendations/companions'
const shape = obj({ source: oneOf(['AI', 'RULE']), note: str })

registerMockHandlers('스트림 테스트', [
  {
    method: 'GET',
    path: PATH,
    handle: ({ query }) =>
      query.get('case') === 'missing'
        ? {
            status: 404,
            data: {
              type: 'about:blank',
              title: '자녀를 찾을 수 없습니다',
              status: 404,
              detail: '자녀를 다시 확인해 주세요.',
              instance: PATH,
            },
          }
        : query.get('case') === 'rule-only'
          ? { status: 200, events: [{ event: 'rule', data: { source: 'RULE', note: '규칙' } }] }
          : {
              status: 200,
              events: [
                { event: 'rule', data: { source: 'RULE', note: '규칙' } },
                { event: 'ai', data: { source: 'AI', note: 7 } },
              ],
            },
  },
])

const lastLog = () => useApiFlowLog.getState().logs.at(-1)

describe('getEventStream: 공통 클라이언트로 text/event-stream 받기', () => {
  beforeEach(() => useApiFlowLog.getState().clear())

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
      mock: true,
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
