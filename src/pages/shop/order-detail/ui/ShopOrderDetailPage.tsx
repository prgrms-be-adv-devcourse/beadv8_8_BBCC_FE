import { Link, useParams } from 'react-router'
import {
  CANCEL_REASON_LABEL,
  canConfirmItem,
  needsCartReview,
  OrderProcessSteps,
  needsCharge,
  OrderProgressBar,
  orderProgress,
  orderSellerGroups,
  paymentDeadline,
  paymentDeadlineLabel,
} from '@/entities/order'
import { ConfirmPurchaseButton } from '@/features/confirm-purchase'
import { useOrderTracking } from '@/features/track-order'
import { OrderTimelineCard } from '@/widgets/order-timeline'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { formatDateTime } from '@/shared/lib'
import { ListSkeleton } from '@/shared/ui/Skeleton'
import { StateMessage } from '@/shared/ui/StateMessage'
import { OrderSellerBlock } from './OrderSellerBlock'
import { PaymentSummary } from './PaymentSummary'

export function ShopOrderDetailPage() {
  const { orderId = '' } = useParams()
  const { query, payments, payment, paymentCheck, delayed } = useOrderTracking(orderId)

  if (query.isPending) return <ListSkeleton rows={4} />
  if (query.isError) return <StateMessage tone="error">{getErrorMessage(query.error)}</StateMessage>

  const order = query.data
  const progress = orderProgress(order)
  const deadline = paymentDeadline(order)
  const expired = order.status === 'CANCELLED' && order.cancelReason === 'PAYMENT_EXPIRED'
  // 제목: 지금 단계 (취소면 「주문 취소」, 결제 전이면 「결제 처리 중」)
  const headline = progress.cancelled
    ? '주문 취소'
    : order.status === 'PENDING_PAYMENT'
      ? '결제 처리 중'
      : progress.steps[progress.current]

  return (
    <div className="shop-look space-y-6">
      <Link
        to={paths.shop.orders}
        className="text-ink-3 hover:text-ink inline-flex items-center gap-1 rounded-md text-[13px] font-semibold transition-colors"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        주문 내역
      </Link>
      {/* 주문 상태: 지금 단계를 제목으로, 아래에 진행 막대 (금액은 오른쪽 결제 정보에) */}
      <section
        aria-label="주문 상태"
        className="border-rule space-y-7 rounded-xl border p-5 md:p-7"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <p className="text-ink-3 flex flex-wrap gap-x-3 text-[13px]">
              <span className="figure">주문번호 {order.id}</span>
              <span className="figure">{formatDateTime(order.orderedAt)} 주문</span>
            </p>
            <h1 className="text-page">{headline}</h1>
          </div>
        </div>
        {/* 취소면 제목이 이미 「주문 취소」라 막대(취소 안내)는 그리지 않는다 */}
        {!progress.cancelled && <OrderProgressBar {...progress} />}
        {/* 결제 처리 중: 서버 처리 단계 (취소면 아래 처리 과정이 멈춘 곳을 보여 준다) */}
        {order.status === 'PENDING_PAYMENT' && <OrderProcessSteps order={order} />}
        {order.status === 'PENDING_PAYMENT' && (
          <p className="text-signal font-semibold">
            예치금으로 결제하는 중이에요… 잠시만 기다려 주세요
            {deadline && (
              <span className="text-ink-2 block text-sm font-normal">
                {deadline.time}까지 결제되지 않으면 주문이 자동으로 취소돼요
              </span>
            )}
          </p>
        )}
        {delayed && (
          <p role="alert" className="text-destructive text-sm">
            결제가 평소보다 오래 걸리고 있어요.{' '}
            {deadline ? `결제 마감 ${deadline.time}까지` : '결제 마감 시간까지'} 결제되지 않으면
            주문이 자동으로 취소되고 예치금은 빠져나가지 않아요.
          </p>
        )}
        {order.status === 'CANCELLED' && (
          <div className="space-y-2">
            <p>
              {order.cancelReason ? CANCEL_REASON_LABEL[order.cancelReason] : '주문이 취소됐어요.'}{' '}
              예치금은 빠져나가지 않았어요.
            </p>
            {expired && (
              <p className="text-ink-2 text-sm">
                {deadline && `결제 마감 ${paymentDeadlineLabel(deadline)} · `}담았던 상품은
                장바구니에 그대로 있어요.
              </p>
            )}
            <p className="flex flex-wrap gap-x-6">
              {needsCharge(order) && (
                <Link to={paths.shop.wallet} className="shop-link">
                  예치금 충전하러 가기
                </Link>
              )}
              {needsCartReview(order) && (
                <Link to={paths.shop.cart} className="shop-link">
                  장바구니에서 다시 확인하기
                </Link>
              )}
            </p>
          </div>
        )}
      </section>

      {/* 넓은 화면: 왼쪽 판매자별 주문 상품 · 처리 과정, 오른쪽 결제 정보 · 배송지 */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-8">
        <div className="space-y-6">
          <section aria-label="주문 상품" className="space-y-3">
            <h2 className="text-section">
              주문 상품
              <span className="text-ink-3 figure ml-2 text-sm font-medium">
                {order.items.length}개
              </span>
            </h2>
            {orderSellerGroups(order).map((group) => (
              <OrderSellerBlock
                key={group.sellerId}
                group={group}
                isCancelled={order.status === 'CANCELLED'}
                action={(item) =>
                  canConfirmItem(item) && (
                    <ConfirmPurchaseButton orderId={order.id} orderItemId={item.id} />
                  )
                }
              />
            ))}
          </section>
          <OrderTimelineCard order={order} />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-32">
          <PaymentSummary
            totalAmount={order.totalAmount}
            payment={payment}
            check={paymentCheck}
            pending={payments.isLoading}
            error={payments.error}
          />
          <section
            aria-label="배송지"
            className="border-rule space-y-2 rounded-lg border p-5 text-sm"
          >
            <h2 className="text-[15px] font-bold">배송지</h2>
            <p className="flex flex-wrap gap-x-3">
              <span className="font-semibold">{order.shippingAddress.recipientName}</span>
              <span className="text-ink-2 figure">{order.shippingAddress.phone}</span>
            </p>
            <p className="text-ink-2">
              <span className="figure">({order.shippingAddress.zipCode})</span>{' '}
              {order.shippingAddress.address}
            </p>
          </section>
        </aside>
      </div>
    </div>
  )
}
