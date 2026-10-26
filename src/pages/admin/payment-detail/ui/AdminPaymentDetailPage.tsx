import { Link, useParams } from 'react-router'
import { OrderStatusTag, useAdminOrdersQuery } from '@/entities/order'
import { PAYMENT_STATUS_LABEL, paymentIssueNote, useAdminPaymentsQuery } from '@/entities/payment'
import { getErrorMessage } from '@/shared/api'
import { adminPathsOf } from '@/shared/config'
import { cn, formatDateTime, formatWon, useArea } from '@/shared/lib'
import { PageHeader } from '@/shared/ui/PageHeader'
import { ListSkeleton } from '@/shared/ui/Skeleton'
import { StateMessage } from '@/shared/ui/StateMessage'

/** 관리자 결제 상세: 지금 결제 상태(실패 · 환불이면 그 내용) → 결제한 주문 · 결제 정보 */
export function AdminPaymentDetailPage() {
  const { paymentId = '' } = useParams()
  const adminPaths = adminPathsOf(useArea())
  // 결제 한 건 관리자 API가 없어 전체 결제에서 찾는다. 주문은 전체 주문(최근 100건)에서
  const payments = useAdminPaymentsQuery()
  const orders = useAdminOrdersQuery(null)
  const payment = payments.data?.find((item) => item.id === paymentId)
  const order = orders.data?.content.find((item) => item.id === payment?.orderId)
  const issue = payment ? paymentIssueNote(payment) : ''

  return (
    <div className="shop-look space-y-6">
      <Link
        to={adminPaths.payments}
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
        전체 결제
      </Link>
      <PageHeader
        mockEndpoints={['GET /admin/payments', 'GET /admin/orders']}
        title={`결제 ${paymentId}`}
        note="GET /admin/payments (BE #326)에서 이 결제를 찾고, GET /admin/orders (BE #323)에서 결제한 주문을 찾는다."
      />
      {payments.isPending && <ListSkeleton rows={2} />}
      {payments.isError && (
        <StateMessage tone="error">{getErrorMessage(payments.error)}</StateMessage>
      )}
      {payments.data && !payment && (
        <p className="bg-paper-2 text-ink-2 rounded-lg py-12 text-center text-sm">
          최근 결제에서 이 결제를 찾지 못했어요.
        </p>
      )}
      {payment && (
        <>
          {/* 결제 상태: 지금 상태를 제목으로, 실패 · 환불이면 아래에 그 내용 (결제 정보에서는 되풀이하지 않는다) */}
          <section aria-label="결제 상태" className="border-rule space-y-1 rounded-lg border p-5">
            <h2 className="text-page">{PAYMENT_STATUS_LABEL[payment.status]}</h2>
            {issue && (
              <p
                className={cn(
                  'text-sm',
                  payment.status === 'FAILED' ? 'text-destructive' : 'text-ink-2',
                )}
              >
                {issue}
              </p>
            )}
          </section>

          {/* 넓은 화면: 왼쪽 결제한 주문, 오른쪽 결제 정보 */}
          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_17rem]">
            <section aria-label="결제한 주문" className="space-y-3">
              <h2 className="text-section">결제한 주문</h2>
              {orders.isPending && <StateMessage>주문을 불러오는 중…</StateMessage>}
              {orders.isError && (
                <StateMessage tone="error">{getErrorMessage(orders.error)}</StateMessage>
              )}
              {orders.data && !order && (
                <p className="bg-paper-2 text-ink-2 rounded-lg px-4 py-8 text-center text-sm">
                  <span className="figure">주문 {payment.orderId}</span> · 최근 주문 목록에 없어서
                  열어 볼 수 없어요.
                </p>
              )}
              {order && (
                <div className="divide-rule border-rule divide-y border-y text-sm">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
                    <Link
                      to={adminPaths.order(order.id)}
                      className="figure hover:text-signal inline-flex min-h-8 items-center font-semibold underline-offset-4 transition-colors hover:underline"
                    >
                      {`주문 ${order.id}`}
                    </Link>
                    <OrderStatusTag status={order.status} />
                    <span className="figure text-ink-2">{formatDateTime(order.orderedAt)}</span>
                    <span className="figure text-ink-2">상품 {order.itemCount}개</span>
                    <span className="figure ml-auto font-semibold">
                      {formatWon(order.totalAmount)}
                    </span>
                  </div>
                </div>
              )}
            </section>
            <aside
              aria-label="결제 정보"
              className="border-rule space-y-1.5 rounded-lg border p-5 text-sm"
            >
              <h2 className="text-[15px] font-bold">결제 정보</h2>
              <dl className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-2 gap-y-1">
                <dt className="text-ink-3">회원</dt>
                <dd>
                  <Link to={adminPaths.member(payment.memberId)} className="shop-link figure">
                    {`회원 ${payment.memberId}`}
                  </Link>
                </dd>
                <dt className="text-ink-3">금액</dt>
                <dd className="figure font-semibold">{formatWon(payment.amount)}</dd>
                <dt className="text-ink-3">결제 일시</dt>
                <dd className="figure">{formatDateTime(payment.paidAt)}</dd>
                <dt className="text-ink-3">만든 일시</dt>
                <dd className="figure">{formatDateTime(payment.createdAt)}</dd>
              </dl>
            </aside>
          </div>
        </>
      )}
    </div>
  )
}
