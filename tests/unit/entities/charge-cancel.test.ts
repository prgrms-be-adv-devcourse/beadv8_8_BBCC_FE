import { describe, expect, it } from 'vitest'
import { isChargeCancelling, toChargeCancellation } from '@/entities/wallet'

describe('충전 취소 응답 (BE ChargeCancelResponse)', () => {
  it('취소 완료(200): 취소 후 잔액까지', () => {
    const result = toChargeCancellation({
      chargeId: 7,
      status: 'CANCELLED',
      amount: 50000,
      balance: 25000,
    })
    expect(result).toEqual({ chargeId: '7', status: 'CANCELLED', amount: 50000, balance: 25000 })
    expect(isChargeCancelling(result)).toBe(false)
  })

  it('토스 결과를 아직 모름(202 CANCELLING): 잔액은 null', () => {
    const result = toChargeCancellation({
      chargeId: 7,
      status: 'CANCELLING',
      amount: 50000,
      balance: null,
    })
    expect(isChargeCancelling(result)).toBe(true)
    expect(result.balance).toBeNull()
  })
})
