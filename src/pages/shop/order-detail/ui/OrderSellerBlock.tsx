import type { ReactNode } from 'react'
import {
  ITEM_STATUS_LABEL,
  unavailableLabel,
  type OrderItem,
  type OrderSellerGroup,
} from '@/entities/order'
import { ProductImage } from '@/entities/product'
import { carrierName, DELIVERY_STATUS_LABEL } from '@/shared/config'
import { cn, formatWon, optionLabel } from '@/shared/lib'

type OrderSellerBlockProps = {
  group: OrderSellerGroup
  /** 취소된 주문이면 주문상품 상태(주문됨)는 감춘다 */
  isCancelled: boolean
  /** 줄마다 오른쪽 동작 (예: 구매확정) */
  action?: (item: OrderItem) => ReactNode
}

/** 판매자 한 곳의 주문 상품: 머리에 상호 · 배송 상태 · 송장, 아래에 상품 줄 */
export function OrderSellerBlock({ group, isCancelled, action }: OrderSellerBlockProps) {
  const { delivery } = group
  return (
    <section aria-label={`${group.sellerName} 주문 상품`} className="border-rule rounded-lg border">
      <div className="border-rule flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b px-4 py-3">
        <p className="flex items-center gap-1.5 text-[15px] font-bold">
          <svg
            viewBox="0 0 24 24"
            aria-hidden
            className="text-signal size-4 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 10v9a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-9" />
            <path d="M3 6.5 5 4h14l2 2.5v1a2.5 2.5 0 0 1-4.5 1.5 2.5 2.5 0 0 1-4.5 0 2.5 2.5 0 0 1-4.5 0A2.5 2.5 0 0 1 3 7.5z" />
          </svg>
          {group.sellerName}
        </p>
        {delivery && (
          <p className="flex flex-wrap items-center gap-x-2 text-[13px]">
            <span className="bg-signal-soft text-signal inline-flex h-6 items-center rounded-sm px-2 text-xs font-semibold">
              {DELIVERY_STATUS_LABEL[delivery.status]}
            </span>
            {delivery.trackingNumber && (
              <span className="text-ink-3 figure">
                {carrierName(delivery.carrier)} {delivery.trackingNumber}
              </span>
            )}
          </p>
        )}
      </div>
      <ul className="divide-rule divide-y px-4">
        {group.items.map((item) => {
          const unavailable = unavailableLabel(item)
          const option = optionLabel(item)
          return (
            <li key={item.id} className="flex flex-wrap items-center gap-4 py-4 sm:flex-nowrap">
              <ProductImage
                src={null}
                alt={item.productName}
                className="rounded-card aspect-[3/4] w-16 shrink-0"
              />
              <div className="min-w-0 flex-1 basis-48 space-y-1">
                <p className="text-sm font-semibold">{item.productName}</p>
                {option && <p className="text-ink-3 text-[13px]">{option}</p>}
                {item.child && (
                  <p className="text-ink-3 text-[13px]">
                    입을 아이 {item.child.name ?? `#${item.child.id}`}, 주문 당시{' '}
                    <span className="figure">{item.child.heightCm}cm</span>
                  </p>
                )}
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-0.5">
                  <span className="figure text-[15px] font-bold">{formatWon(item.amount)}</span>
                  <span className="text-ink-3 figure text-xs">
                    {formatWon(item.unitPrice)} × {item.quantity}
                  </span>
                  {!isCancelled && (
                    <span
                      className={cn(
                        'inline-flex h-5 items-center rounded-sm px-1.5 text-[11px] font-semibold',
                        item.status === 'CONFIRMED'
                          ? 'bg-signal-soft text-signal'
                          : 'bg-paper-2 text-ink-2',
                      )}
                    >
                      {ITEM_STATUS_LABEL[item.status]}
                      {item.confirmType === 'AUTO' && ' (자동)'}
                    </span>
                  )}
                  {unavailable && (
                    <span className="bg-destructive/8 text-destructive inline-flex h-5 items-center rounded-sm px-1.5 text-[11px] font-semibold">
                      {unavailable}
                    </span>
                  )}
                </p>
              </div>
              {action && <div className="ml-auto">{action(item)}</div>}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
