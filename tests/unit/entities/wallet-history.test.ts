import { describe, expect, it } from 'vitest'
import {
  isChargeConfirming,
  toCharge,
  toChargeConfirmation,
  toWalletTransaction,
  WALLET_TX_LABEL,
} from '@/entities/wallet'

describe('충전 승인 결과', () => {
  it('202(토스 결과 확인 중)면 CONFIRMING으로 보고 잔액은 아직 없다', () => {
    const confirmation = toChargeConfirmation({
      chargeId: 7,
      status: 'CONFIRMING',
      amount: 50000,
      balance: null,
    })
    expect(confirmation).toEqual({
      chargeId: '7',
      status: 'CONFIRMING',
      amount: 50000,
      balance: null,
    })
    expect(isChargeConfirming(confirmation)).toBe(true)
    expect(isChargeConfirming({ ...confirmation, status: 'DONE' })).toBe(false)
  })
})

describe('예치금 거래 내역', () => {
  it('거래 종류 이름 (BE WalletLedgerType)', () => {
    expect(WALLET_TX_LABEL).toEqual({
      CHARGE: '충전',
      CHARGE_CANCEL: '충전 취소',
      CHARGE_CANCEL_REVERT: '충전 취소 되돌림',
      PAYMENT: '주문 결제',
      REFUND: '환불',
      SETTLEMENT: '정산 적립',
    })
  })
  it('toWalletTransaction: 숫자 ID → 문자열, 입금 여부', () => {
    expect(
      toWalletTransaction({
        ledgerId: 3,
        type: 'PAYMENT',
        amount: -25000,
        balanceAfter: 75000,
        refId: 9,
        createdAt: '2026-10-15T10:00:00',
      }),
    ).toEqual({
      id: '3',
      type: 'PAYMENT',
      amount: -25000,
      balanceAfter: 75000,
      refId: '9',
      createdAt: '2026-10-15T10:00:00',
      deposit: false,
    })
  })
  it('원인 ID가 없으면 null', () => {
    expect(
      toWalletTransaction({
        ledgerId: 4,
        type: 'CHARGE_CANCEL_REVERT',
        amount: 50000,
        balanceAfter: 150000,
        refId: null,
        createdAt: '2026-10-15T10:00:00',
      }),
    ).toMatchObject({ refId: null, deposit: true })
  })
})

describe('충전 내역', () => {
  it('toCharge: 요청 시각(createdAt)을 함께 쓴다', () => {
    expect(
      toCharge({
        chargeId: 5,
        orderId: 'toss-5',
        amount: 10000,
        status: 'PENDING',
        approvedAt: null,
        createdAt: '2026-10-15T09:00:00',
      }),
    ).toEqual({
      id: '5',
      amount: 10000,
      status: 'PENDING',
      approvedAt: null,
      createdAt: '2026-10-15T09:00:00',
    })
  })
})
