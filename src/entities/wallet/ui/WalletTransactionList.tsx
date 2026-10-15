import { cn, formatDateTime, formatWon } from '@/shared/lib'
import { WALLET_TX_LABEL, type WalletTransaction } from '../model/wallet'

type WalletTransactionListProps = { transactions: WalletTransaction[] }

/** 예치금 거래 내역: 종류 · 금액(+/−) · 거래 뒤 잔액 (최신이 위) */
export function WalletTransactionList({ transactions }: WalletTransactionListProps) {
  return (
    <ol className="space-y-1">
      {transactions.map((tx) => (
        <li
          key={tx.id}
          className="flex items-center gap-3 border-t pt-1 text-sm"
          aria-label={`거래 ${WALLET_TX_LABEL[tx.type]}`}
        >
          <span className="w-20 font-medium">{WALLET_TX_LABEL[tx.type]}</span>
          <span className="text-muted-foreground">{formatDateTime(tx.createdAt)}</span>
          <span
            className={cn(
              'ml-auto font-semibold',
              tx.deposit ? 'text-green-700' : 'text-destructive',
            )}
          >
            {tx.deposit ? '+' : '−'}
            {formatWon(Math.abs(tx.amount))}
          </span>
          <span className="text-muted-foreground w-28 text-right">
            잔액 {formatWon(tx.balanceAfter)}
          </span>
        </li>
      ))}
    </ol>
  )
}
