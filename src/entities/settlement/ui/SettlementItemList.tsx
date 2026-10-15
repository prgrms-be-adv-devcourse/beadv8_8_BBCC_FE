import { formatDateTime, formatWon } from '@/shared/lib'
import type { SettlementItem } from '../model/settlement'

type SettlementItemListProps = { items: SettlementItem[] }

/** 정산서 항목 (BE 응답에 상품명이 없어 주문 · 주문상품 번호로) */
export function SettlementItemList({ items }: SettlementItemListProps) {
  return (
    <ul className="text-muted-foreground mt-1 list-disc pl-5 text-xs">
      {items.map((item) => (
        <li key={item.orderItemId}>
          주문 #{item.orderId} · 주문상품 #{item.orderItemId} · {formatWon(item.amount)} · 구매확정{' '}
          {formatDateTime(item.confirmedAt)}
        </li>
      ))}
    </ul>
  )
}
