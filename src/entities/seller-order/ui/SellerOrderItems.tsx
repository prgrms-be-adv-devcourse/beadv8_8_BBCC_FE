import { formatWon, optionLabel } from '@/shared/lib'
import type { SellerOrder } from '../model/seller-order'

type SellerOrderItemsProps = { items: SellerOrder['items'] }

/** 판매 주문의 상품 줄: 왼쪽에 상품명 · 옵션 · 입을 아이, 오른쪽에 금액 · 수량 */
export function SellerOrderItems({ items }: SellerOrderItemsProps) {
  return (
    <ul className="divide-rule border-rule divide-y border-y">
      {items.map((item) => {
        const option = optionLabel(item)
        return (
          <li key={item.id} className="flex items-start justify-between gap-4 py-4">
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-semibold">{item.productName}</p>
              {option && <p className="text-ink-3 text-[13px]">{option}</p>}
              {item.childLabel && (
                <p className="text-ink-3 text-[13px]">입을 아이 {item.childLabel}</p>
              )}
            </div>
            <div className="shrink-0 space-y-1 text-right">
              <p className="figure text-[15px] font-bold">{formatWon(item.amount)}</p>
              <p className="text-ink-3 figure text-[13px]">수량 {item.quantity}</p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
