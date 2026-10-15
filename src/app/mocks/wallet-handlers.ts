import type { PaymentSummaryDto } from '@/entities/payment'
import type { ChargeDetailDto, WalletTransactionDto } from '@/entities/wallet'
import type { MockHandler, Page } from '@/shared/api'
import { fetchReal, memberIdOf, page } from './mock-utils'
import { settlements } from './settlement-handlers'

// 예치금 거래 내역(기획서 8장 보완)은 백엔드에 없다.
// 실제 충전 내역 · 결제 내역 · (목) 정산으로 원장을 만들고, 거래 뒤 잔액은 지금 잔액에서 거꾸로 계산한다

type Source = {
  balance: number
  charges: ChargeDetailDto[]
  payments: PaymentSummaryDto[]
  settlements: { settlementId: string; payoutAmount: number; status: string; settledAt: string }[]
}

type Entry = Omit<WalletTransactionDto, 'transactionId' | 'balanceAfter'>

const PAID = ['COMPLETED', 'PARTIALLY_REFUNDED', 'REFUNDED']

export function buildWalletTransactions(source: Source): WalletTransactionDto[] {
  const entries: Entry[] = []
  for (const charge of source.charges) {
    if (!charge.approvedAt || !['DONE', 'CANCELLING', 'CANCELLED'].includes(charge.status)) continue
    const base = { refId: charge.chargeId, createdAt: charge.approvedAt }
    entries.push({ ...base, type: 'CHARGE', amount: charge.amount })
    if (charge.status === 'CANCELLED')
      entries.push({ ...base, type: 'CHARGE_CANCEL', amount: -charge.amount })
  }
  for (const payment of source.payments) {
    if (!PAID.includes(payment.status) || !payment.paidAt) continue
    const base = { refId: payment.paymentId, createdAt: payment.paidAt }
    entries.push({ ...base, type: 'PAYMENT', amount: -payment.amount })
    if (payment.refundedAmount > 0)
      entries.push({ ...base, type: 'REFUND', amount: payment.refundedAmount })
  }
  for (const settlement of source.settlements) {
    if (settlement.status !== 'COMPLETED') continue
    entries.push({
      refId: Number(settlement.settlementId.replace(/\D/g, '')) || 0,
      createdAt: settlement.settledAt,
      type: 'SETTLEMENT',
      amount: settlement.payoutAmount,
    })
  }
  // 시간순(같은 시각은 넣은 순서) → 마지막 거래 뒤 잔액 = 지금 잔액
  const ordered = entries
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => a.entry.createdAt.localeCompare(b.entry.createdAt) || a.index - b.index)
    .map(({ entry }) => entry)
  let after = source.balance
  const result: WalletTransactionDto[] = []
  for (let i = ordered.length - 1; i >= 0; i--) {
    result.push({ ...ordered[i], transactionId: i + 1, balanceAfter: after })
    after -= ordered[i].amount
  }
  return result
}

export const walletHandlers: MockHandler[] = [
  {
    method: 'GET',
    path: '/wallets/me/transactions',
    handle: async (request) => {
      const memberId = memberIdOf(request)
      const [wallet, charges, payments] = await Promise.all([
        fetchReal<{ balance: number }>(request, '/wallets/me'),
        fetchReal<Page<ChargeDetailDto>>(request, '/wallets/me/charges?size=100'),
        fetchReal<Page<PaymentSummaryDto>>(request, '/payments?size=100'),
      ])
      const transactions = buildWalletTransactions({
        balance: wallet.balance,
        charges: charges.content,
        payments: payments.content,
        settlements: settlements.filter((item) => item.sellerId === memberId),
      })
      return { status: 200, data: page(transactions, request) }
    },
  },
]
