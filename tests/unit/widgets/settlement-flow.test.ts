import { describe, expect, it } from 'vitest'
import { domainOf, flowOf } from '@/widgets/api-flow-panel/config/domain-flow'

describe('관리자 정산 호출 → 흐름도', () => {
  it('정산서 목록 · 지급 재요청 · 실행 조회는 정산 도메인', () => {
    expect(domainOf('/admin/settlements?page=0&size=20')).toBe('settlement')
    expect(domainOf('/admin/settlements/5/retry')).toBe('settlement')
    expect(domainOf('/admin/settlement-runs/7')).toBe('settlement')
  })

  it('지급 재요청도 실행처럼 정산 → 결제 입금 요청 이벤트를 보여 준다', () => {
    expect(flowOf('POST', '/admin/settlements/5/retry').map((step) => step.name)).toEqual([
      'settlement.payout-requested',
      'payment.payout-completed',
    ])
    expect(flowOf('GET', '/admin/settlements')).toEqual([])
  })
})
