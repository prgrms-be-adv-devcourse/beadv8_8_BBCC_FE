import { cn, formatDateTime, formatWon } from '@/shared/lib'
import { WALLET_TX_LABEL, type WalletTransaction } from '../model/wallet'
import { transactionsByDay } from '../model/wallet.rules'

type WalletTransactionListProps = {
  transactions: WalletTransaction[]
  /** 날짜별로 묶어 날짜 이름을 위에 둔다 (이용 내역 화면) */
  isGroupedByDay?: boolean
}

/** 예치금 거래 내역: 종류 · 시각 왼쪽, 금액(+/−) · 거래 뒤 잔액 오른쪽 (최신이 위) */
export function WalletTransactionList({
  transactions,
  isGroupedByDay = false,
}: WalletTransactionListProps) {
  if (!isGroupedByDay) {
    return (
      <ol className="divide-border border-border divide-y border-y">
        {transactions.map((tx) => (
          <TransactionItem key={tx.id} tx={tx} timeLabel={formatDateTime(tx.createdAt)} />
        ))}
      </ol>
    )
  }
  return (
    <div className="space-y-6">
      {transactionsByDay(transactions).map((day) => (
        <section key={day.date} aria-label={day.label} className="space-y-1">
          <h3 className="text-muted-foreground text-[13px] font-semibold">{day.label}</h3>
          <ol className="divide-border divide-y">
            {day.items.map((tx) => (
              <TransactionItem key={tx.id} tx={tx} timeLabel={tx.createdAt.slice(11, 16)} />
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}

type TransactionItemProps = { tx: WalletTransaction; timeLabel: string }

function TransactionItem({ tx, timeLabel }: TransactionItemProps) {
  return (
    <li
      className="flex items-center justify-between gap-4 py-3.5 text-sm"
      aria-label={`거래 ${WALLET_TX_LABEL[tx.type]}`}
    >
      <span className="flex min-w-0 items-center gap-3">
        {/* 종류 첫 글자 동그라미: 들어온 돈은 자두, 나간 돈은 회색 */}
        <span
          aria-hidden
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold',
            tx.deposit ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
          )}
        >
          {WALLET_TX_LABEL[tx.type].slice(0, 1)}
        </span>
        <span className="min-w-0 space-y-0.5">
          <span className="block font-semibold">{WALLET_TX_LABEL[tx.type]}</span>
          <span className="text-muted-foreground figure block text-xs">{timeLabel}</span>
        </span>
      </span>
      <span className="shrink-0 space-y-0.5 text-right">
        <span
          className={cn(
            'figure block text-[15px] font-bold',
            tx.deposit ? 'text-primary' : 'text-foreground',
          )}
        >
          {tx.deposit ? '+' : '−'}
          {formatWon(Math.abs(tx.amount))}
        </span>
        <span className="text-muted-foreground figure block text-xs">
          잔액 {formatWon(tx.balanceAfter)}
        </span>
      </span>
    </li>
  )
}
