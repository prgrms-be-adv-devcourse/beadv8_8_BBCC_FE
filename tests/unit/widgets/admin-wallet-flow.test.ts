import { describe, expect, it } from 'vitest'
import { domainOf, flowOf } from '@/widgets/api-flow-panel/config/domain-flow'

describe('관리자 지갑 호출 → 흐름도', () => {
  it('지갑 목록 · 잔액 돌려주기는 결제 도메인이고, 뒤따르는 이벤트는 없다', () => {
    expect(domainOf('/admin/wallets?frozen=true&hasBalance=false&page=0&size=20')).toBe('payment')
    expect(domainOf('/admin/wallets/101/return-balance')).toBe('payment')
    expect(flowOf('POST', '/admin/wallets/101/return-balance')).toEqual([])
  })
})
