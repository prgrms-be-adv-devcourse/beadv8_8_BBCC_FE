import type { ReactNode } from 'react'
import {
  canTrackDelivery,
  cancelledRefundOf,
  childNameOf,
  ITEM_STATUS_LABEL,
  sellerGroupCancelled,
  unavailableLabel,
  type OrderItem,
  type OrderSellerGroup,
} from '@/entities/order'
import {
  ALL_CATEGORIES_ICON,
  ProductImage,
  lineImageUrl,
  productIdsWithoutImage,
  useProductImageUrls,
} from '@/entities/product'
import { carrierName, DELIVERY_STATUS_LABEL } from '@/shared/config'
import { cn, formatWon, labelOf, optionLabel } from '@/shared/lib'
import { DeliveryTrackingPanel } from './DeliveryTrackingPanel'

type OrderSellerBlockProps = {
  orderId: string
  group: OrderSellerGroup
  /** 주문에 자녀 이름이 비어 있을 때 쓸 내 자녀 이름 (자녀 ID → 이름) */
  childNames: Readonly<Record<string, string>>
  /** 취소된 주문이면 주문상품 상태(주문됨)는 감춘다 */
  isCancelled: boolean
  /** 줄마다 오른쪽 동작 (예: 구매확정) */
  action?: (item: OrderItem) => ReactNode
}

/** 판매자 한 곳의 주문 상품: 머리에 상호 · 배송 상태 · 송장, 아래에 상품 줄 */
export function OrderSellerBlock({
  orderId,
  group,
  childNames,
  isCancelled,
  action,
}: OrderSellerBlockProps) {
  // 주문 응답에 사진이 없어 상품 상세의 대표 사진을 읽는다 (판매가 끝나 상세가 없으면 기본 이미지)
  const images = useProductImageUrls(productIdsWithoutImage(group.items))
  const { delivery } = group
  return (
    <section aria-label={`${group.sellerName} 주문 상품`} className="border-ink border-[1.5px]">
      <div className="border-ink flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b-[1.5px] px-4 py-3">
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
            <span className="border-ink bg-paper inline-flex h-6 items-center border px-2 text-xs font-bold">
              {labelOf(DELIVERY_STATUS_LABEL, delivery.status)}
            </span>
            {delivery.trackingNumber && (
              <span className="text-ink-3 figure">
                {carrierName(delivery.carrier)} {delivery.trackingNumber}
              </span>
            )}
          </p>
        )}
      </div>
      {delivery && canTrackDelivery(delivery) && (
        <DeliveryTrackingPanel orderId={orderId} deliveryId={delivery.id} />
      )}
      <ul className="divide-rule divide-y px-4">
        {group.items.map((item) => {
          const unavailable = unavailableLabel(item)
          const option = optionLabel(item)
          return (
            <li key={item.id} className="flex flex-wrap items-center gap-4 py-4 sm:flex-nowrap">
              <ProductImage
                src={lineImageUrl(item, images)}
                alt={item.productName}
                doodle={ALL_CATEGORIES_ICON}
                className="border-ink aspect-[4/5] w-[72px] shrink-0 border"
              />
              <div className="min-w-0 flex-1 basis-48 space-y-1">
                <p className="text-[15px] font-bold">{item.productName}</p>
                {option && <p className="text-ink-2 text-[13px]">{option}</p>}
                {item.child && (
                  <p className="text-ink-3 text-[13px]">
                    입을 아이 {childNameOf(item.child, childNames)}, 주문 당시{' '}
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
                        'inline-flex h-5 items-center px-1.5 text-[11px] font-bold',
                        item.status === 'CONFIRMED'
                          ? 'bg-fit-soft text-ink'
                          : 'bg-paper-2 text-ink-2',
                      )}
                    >
                      {labelOf(ITEM_STATUS_LABEL, item.status)}
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
      {!isCancelled && sellerGroupCancelled(group) && (
        <p className="text-destructive border-rule border-t px-4 py-3 text-[13px]">
          발송 전에 취소됐어요 ·{' '}
          <span className="figure">{formatWon(cancelledRefundOf(group.items))}</span> 환불
        </p>
      )}
    </section>
  )
}
