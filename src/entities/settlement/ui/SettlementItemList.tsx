import { formatDateTime, formatWon } from '@/shared/lib'
import type { SettlementDetail } from '../model/settlement'

type SettlementItemListProps = { items: SettlementDetail['items'] }

export function SettlementItemList({ items }: SettlementItemListProps) {
  return (
    <ul className="text-muted-foreground mt-1 list-disc pl-5 text-xs">
      {items.map((item) => (
        <li key={item.orderItemId}>
          {item.productName} · {formatWon(item.amount)} · 구매확정{' '}
          {formatDateTime(item.confirmedAt)}
        </li>
      ))}
    </ul>
  )
}
