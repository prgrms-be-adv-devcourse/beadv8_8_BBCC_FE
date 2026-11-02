import { describe, expect, it } from 'vitest'
import { hasBalanceToRefund } from '@/entities/wallet'

describe('탈퇴할 때 운영자가 환급할 예치금이 남았는지 (BE #670: 탈퇴하면 지갑 동결, 잔액은 운영자 환급)', () => {
  it('1원이라도 남으면 남은 것', () => {
    expect(hasBalanceToRefund(1)).toBe(true)
    expect(hasBalanceToRefund(25_000)).toBe(true)
  })

  it('0원이면 남지 않은 것', () => {
    expect(hasBalanceToRefund(0)).toBe(false)
  })

  it('잔액을 아직 모르면 남지 않은 것으로 본다 (안내는 일반 문구로)', () => {
    expect(hasBalanceToRefund(undefined)).toBe(false)
  })
})
