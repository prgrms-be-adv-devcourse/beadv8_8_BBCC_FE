import { describe, expect, it } from 'vitest'
import {
  canReturnWalletBalance,
  toAdminWallet,
  toAdminWalletParams,
  toBalanceReturn,
  toReturnBalanceRequest,
} from '@/entities/wallet'

describe('관리자 지갑 (BE AdminWalletController)', () => {
  it('목록 한 줄: ID는 문자열, 동결 시각이 없으면 null', () => {
    expect(
      toAdminWallet({ walletId: 11, memberId: 4, balance: 25000, frozenAt: '2026-11-01T09:00:00' }),
    ).toEqual({ id: '11', memberId: '4', balance: 25000, frozenAt: '2026-11-01T09:00:00' })
    expect(toAdminWallet({ walletId: 1, memberId: 1, balance: 0, frozenAt: null }).frozenAt).toBe(
      null,
    )
  })

  it('거르기 → 요청 값: 고르지 않으면 false (거르지 않음), 한 페이지 20개', () => {
    expect(toAdminWalletParams({ frozenOnly: false, withBalanceOnly: false }, 0)).toEqual({
      frozen: false,
      hasBalance: false,
      page: 0,
      size: 20,
    })
    expect(toAdminWalletParams({ frozenOnly: true, withBalanceOnly: true }, 2)).toEqual({
      frozen: true,
      hasBalance: true,
      page: 2,
      size: 20,
    })
  })

  it('잔액 돌려주기 요청 금액은 목록에서 본 잔액이다', () => {
    expect(
      toReturnBalanceRequest({ id: '11', memberId: '4', balance: 25000, frozenAt: '2026-11-01' }),
    ).toEqual({ amount: 25000 })
  })

  it('잔액 돌려주기 결과: ID는 문자열, 남은 잔액 0', () => {
    expect(
      toBalanceReturn({
        balanceReturnId: 3,
        walletId: 11,
        memberId: 4,
        amount: 25000,
        balance: 0,
        ledgerId: 90,
        returnedAt: '2026-11-12T10:00:00',
      }),
    ).toEqual({
      id: '3',
      walletId: '11',
      memberId: '4',
      amount: 25000,
      balance: 0,
      returnedAt: '2026-11-12T10:00:00',
    })
  })

  describe('잔액을 돌려줄 수 있는 지갑 = 동결됐고 잔액이 0보다 큰 지갑 (BE WALLET_NOT_FROZEN · @Positive)', () => {
    const frozen = { frozenAt: '2026-11-01T09:00:00' }
    it('동결 + 잔액 1원 이상이면 된다', () => {
      expect(canReturnWalletBalance({ ...frozen, balance: 1 })).toBe(true)
      expect(canReturnWalletBalance({ ...frozen, balance: 25000 })).toBe(true)
    })
    it('잔액이 0이면 안 된다', () => {
      expect(canReturnWalletBalance({ ...frozen, balance: 0 })).toBe(false)
    })
    it('동결되지 않은 지갑은 안 된다', () => {
      expect(canReturnWalletBalance({ frozenAt: null, balance: 25000 })).toBe(false)
    })
  })
})
