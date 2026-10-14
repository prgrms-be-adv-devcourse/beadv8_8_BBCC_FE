import { formatDateTime, formatWon } from '@/shared/lib'
import type { SettlementDetail } from '../model/settlement'

export function SettlementItemList({ items }: { items: SettlementDetail['items'] }) {
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
