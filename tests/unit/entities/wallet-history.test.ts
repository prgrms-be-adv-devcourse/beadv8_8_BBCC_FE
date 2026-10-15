import { describe, expect, it } from 'vitest'
import { buildWalletTransactions } from '@/app/mocks/wallet-handlers'
import {
  isChargeConfirming,
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
      PAYMENT: '주문 결제',
      REFUND: '환불',
      SETTLEMENT: '정산 적립',
    })
  })
  it('toWalletTransaction: 숫자 ID → 문자열, 입금 여부', () => {
    expect(
      toWalletTransaction({
        transactionId: 3,
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
})

describe('목: 거래 내역은 실제 충전 · 결제 · 정산 기록으로 만들고, 거래 뒤 잔액은 지금 잔액에서 거꾸로 계산', () => {
  const charge = (chargeId: number, amount: number, status: string, approvedAt: string | null) => ({
    chargeId,
    orderId: `toss-${chargeId}`,
    amount,
    status,
    approvedAt,
  })
  const payment = (
    paymentId: number,
    amount: number,
    status: string,
    paidAt: string,
    refundedAmount = 0,
  ) => ({
    paymentId,
    orderId: paymentId + 100,
    amount,
    refundedAmount,
    status,
    failureCode: null,
    paidAt,
    createdAt: paidAt,
  })

  it('충전 +, 결제 −, 최신이 위, 마지막 거래 뒤 잔액 = 지금 잔액', () => {
    const list = buildWalletTransactions({
      balance: 125000,
      charges: [charge(1, 50000, 'DONE', '2026-10-15T10:00:00')],
      payments: [payment(2, 25000, 'COMPLETED', '2026-10-15T11:00:00')],
      settlements: [],
    })
    expect(list.map((tx) => [tx.type, tx.amount, tx.balanceAfter])).toEqual([
      ['PAYMENT', -25000, 125000],
      ['CHARGE', 50000, 150000],
    ])
  })

  it('승인 안 된 충전 · 실패 결제는 잔액이 바뀌지 않아 빠진다', () => {
    const list = buildWalletTransactions({
      balance: 100000,
      charges: [charge(1, 50000, 'PENDING', null), charge(2, 10000, 'EXPIRED', null)],
      payments: [payment(3, 999999, 'FAILED', '2026-10-15T10:00:00')],
      settlements: [],
    })
    expect(list).toEqual([])
  })

  it('충전 취소는 충전 + 취소 두 줄, 환불은 결제 뒤 + 한 줄, 정산 적립은 완료된 것만', () => {
    const list = buildWalletTransactions({
      balance: 100000,
      charges: [charge(1, 50000, 'CANCELLED', '2026-10-15T09:00:00')],
      payments: [payment(2, 30000, 'REFUNDED', '2026-10-15T10:00:00', 30000)],
      settlements: [
        {
          settlementId: 'S1',
          payoutAmount: 22500,
          status: 'COMPLETED',
          settledAt: '2026-10-15T12:00:00',
        },
        {
          settlementId: 'S2',
          payoutAmount: 9000,
          status: 'FAILED',
          settledAt: '2026-10-15T13:00:00',
        },
      ],
    })
    expect(list.map((tx) => tx.type)).toEqual([
      'SETTLEMENT',
      'REFUND',
      'PAYMENT',
      'CHARGE_CANCEL',
      'CHARGE',
    ])
    expect(list[0].balanceAfter).toBe(100000)
    expect(list.at(-1)?.balanceAfter).toBe(100000 - 22500 - 30000 + 30000 + 50000 - 50000 + 50000)
  })
})
