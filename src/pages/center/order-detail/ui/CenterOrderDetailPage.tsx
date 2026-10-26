import { Link, useLocation, useParams } from 'react-router'
import {
  nextShippingStep,
  SellerOrderItems,
  useSellerOrdersQuery,
  type NextShippingStep,
} from '@/entities/seller-order'
import { ShipOrderControls } from '@/features/ship-order'
import { getErrorMessage } from '@/shared/api'
import { carrierName, DELIVERY_STATUS_LABEL, sellerPathsOf } from '@/shared/config'
import { formatDateTime, useArea } from '@/shared/lib'
import { PageHeader } from '@/shared/ui/PageHeader'
import { ListSkeleton } from '@/shared/ui/Skeleton'
import { StateMessage } from '@/shared/ui/StateMessage'

/** 상태 묶음 제목 아래 한 줄: 지금 할 일 */
const NEXT_STEP_GUIDE: Record<Exclude<NextShippingStep, null>, string> = {
  SHIP: '택배사와 송장 번호를 넣고 발송해요.',
  DELIVER: '배송이 끝나면 배송 완료로 바꿔요.',
}

/** 판매 주문 상세: 지금 배송 상태 · 다음 할 일 → 상품 줄 · 받는 분 · 송장 · 주문 정보 */
export function CenterOrderDetailPage() {
  const { sellerOrderId = '' } = useParams()
  const sellerPaths = sellerPathsOf(useArea())
  // 목록에서 넘겨준 탭(?tab=)으로 돌아간다
  const listSearch = (useLocation().state as { listSearch?: string } | null)?.listSearch ?? ''
  // 판매 주문은 목록 API만 있어 목록에서 찾는다
  const orders = useSellerOrdersQuery()
  const order = orders.data?.content.find((item) => item.id === sellerOrderId)
  const step = order ? nextShippingStep(order) : null

  return (
    <div className="shop-look space-y-6">
      <Link
        to={{ pathname: sellerPaths.orders, search: listSearch }}
        className="text-ink-3 hover:text-ink inline-flex min-h-8 items-center gap-1 rounded-md text-[13px] font-semibold transition-colors"
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
        주문 · 배송
      </Link>
      <PageHeader
        title={`판매 주문 #${sellerOrderId}`}
        step="⑤"
        note="송장을 넣어 발송하고 배송 완료로 바꿔요."
      />
      {orders.isPending && <ListSkeleton rows={2} />}
      {orders.isError && <StateMessage tone="error">{getErrorMessage(orders.error)}</StateMessage>}
      {orders.data && !order && (
        <p className="bg-paper-2 text-ink-2 rounded-lg py-12 text-center text-sm">
          없는 판매 주문이에요.
        </p>
      )}
      {order && (
        <>
          {/* 배송 상태: 지금 상태를 제목으로, 아래에 다음 할 일 */}
          <section aria-label="배송 상태" className="border-rule space-y-4 rounded-lg border p-5">
            <div className="space-y-1">
              <h2 className="text-page">{DELIVERY_STATUS_LABEL[order.status]}</h2>
              {step && <p className="text-ink-2 text-sm">{NEXT_STEP_GUIDE[step]}</p>}
            </div>
            <ShipOrderControls sellerOrder={order} />
          </section>

          {/* 넓은 화면: 왼쪽 상품 줄, 오른쪽 받는 분 · 송장 · 주문 정보 */}
          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_17rem]">
            <section aria-label="주문 상품" className="space-y-3">
              <h2 className="text-section">
                주문 상품
                <span className="text-ink-3 figure ml-2 text-sm font-medium">
                  {order.items.length}개
                </span>
              </h2>
              <SellerOrderItems items={order.items} />
            </section>
            <aside className="border-rule divide-rule divide-y rounded-lg border text-sm">
              <section aria-label="받는 분" className="space-y-1.5 p-5">
                <h2 className="text-[15px] font-bold">받는 분</h2>
                <p className="font-semibold">{order.recipientName}</p>
                <p className="text-ink-2">{order.address}</p>
              </section>
              <section aria-label="송장" className="space-y-1.5 p-5">
                <h2 className="text-[15px] font-bold">송장</h2>
                {order.trackingNumber ? (
                  <p className="figure">
                    {carrierName(order.carrier)} {order.trackingNumber}
                  </p>
                ) : (
                  <p className="text-ink-3">아직 송장이 없어요.</p>
                )}
              </section>
              <section aria-label="주문 정보" className="space-y-1.5 p-5">
                <h2 className="text-[15px] font-bold">주문 정보</h2>
                <dl className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-2 gap-y-1">
                  <dt className="text-ink-3">주문 번호</dt>
                  <dd className="figure">{order.orderId}</dd>
                  <dt className="text-ink-3">주문 시각</dt>
                  <dd className="figure">{formatDateTime(order.orderedAt)}</dd>
                </dl>
              </section>
            </aside>
          </div>
        </>
      )}
    </div>
  )
}
