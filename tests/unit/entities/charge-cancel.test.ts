import { describe, expect, it } from 'vitest'
import {
  cancelChargeNoticeOf,
  isChargeAlreadyEnded,
  isChargeCancelling,
  toChargeCancellation,
} from '@/entities/wallet'

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

describe('충전 결과 안내', () => {
  it('취소 완료(200)면 취소했다고, 확인 중(202)이면 확인 중이라고 알린다', () => {
    expect(cancelChargeNoticeOf({ status: 'CANCELLED' })).toBe('충전을 취소했어요')
    expect(cancelChargeNoticeOf({ status: 'CANCELLING' })).toBe('토스에서 취소를 확인하는 중이에요')
  })
  it('409(이미 처리 · 만료된 충전)만 끝난 충전으로 본다', () => {
    expect(isChargeAlreadyEnded(409)).toBe(true)
    expect(isChargeAlreadyEnded(400)).toBe(false)
    expect(isChargeAlreadyEnded(404)).toBe(false)
    expect(isChargeAlreadyEnded(null)).toBe(false)
  })
})
