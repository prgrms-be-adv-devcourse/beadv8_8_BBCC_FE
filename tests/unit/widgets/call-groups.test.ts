import { describe, expect, it } from 'vitest'
import type { ApiCallLog } from '@/shared/api'
import {
  groupCallsByStep,
  spotlightCall,
  summarizeResponse,
} from '@/widgets/api-flow-panel/model/call-groups'

let id = 0
const log = (patch: Partial<ApiCallLog> = {}): ApiCallLog => ({
  id: ++id,
  action: null,
  actor: '1',
  method: 'GET',
  path: '/orders',
  status: 200,
  durationMs: 10,
  startedAt: '',
  mock: false,
  requestBody: null,
  responseBody: null,
  contractIssues: [],
  step: null,
  ...patch,
})

describe('groupCallsByStep: 단계별 묶음 (최신 묶음 먼저)', () => {
  it('이어지는 같은 단계는 한 묶음, 다시 오면 새 묶음, 단계 없으면 기타', () => {
    const logs = [
      log({ step: '①', action: '자동 시연 · 자녀 등록' }),
      log({ step: '①', action: '자동 시연 · 자녀 등록' }),
      log({ step: '②', status: 400, action: '판매자 신청' }),
      log({ step: '①' }),
      log({ step: null }),
    ]
    const groups = groupCallsByStep(logs)
    expect(groups.map((g) => `${g.step}:${g.logs.length}`)).toEqual(['기타:1', '①:1', '②:1', '①:2'])
    expect(groups[3].actions).toEqual(['자녀 등록'])
    expect(groups[2].failed).toBe(1)
  })
})

describe('spotlightCall: 방금 호출', () => {
  const isKey = (l: ApiCallLog) => l.action !== null
  it('최근(5건 안) 실패가 먼저, 아니면 마지막 행동 호출', () => {
    const ok = log({ action: '주문하기', method: 'POST' })
    const background = log()
    expect(spotlightCall([ok, background], isKey)?.id).toBe(ok.id)
    const failed = log({ status: 409, action: '주문하기' })
    expect(spotlightCall([ok, failed, log()], isKey)?.id).toBe(failed.id)
  })
  it('비면 null', () => {
    expect(spotlightCall([], () => true)).toBeNull()
  })
})

describe('summarizeResponse: 응답 핵심 값', () => {
  it('상태 · 번호 · 금액, 목록은 건수, 오류는 detail', () => {
    expect(
      summarizeResponse({ orderId: '12', status: 'PAID', totalAmount: 25000, items: [] }),
    ).toEqual(['status PAID', 'orderId 12', 'totalAmount 25,000'])
    expect(summarizeResponse({ content: [1, 2], page: 0 })).toEqual(['2건'])
    expect(summarizeResponse([1, 2, 3])).toEqual(['3건'])
    expect(
      summarizeResponse({
        type: 'about:blank',
        title: '잘못된 요청',
        status: 400,
        detail: '하이픈 없는 숫자',
      }),
    ).toEqual(['하이픈 없는 숫자'])
    expect(summarizeResponse(null)).toEqual([])
  })
})
