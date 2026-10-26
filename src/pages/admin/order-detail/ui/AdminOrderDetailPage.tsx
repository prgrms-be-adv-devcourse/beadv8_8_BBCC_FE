import { Link, useLocation, useParams } from 'react-router'
import { CANCEL_REASON_LABEL, ORDER_STATUS_LABEL, useAdminOrdersQuery } from '@/entities/order'
import { paymentIssueNote, PaymentStatusTag, useAdminPaymentsQuery } from '@/entities/payment'
import { getErrorMessage } from '@/shared/api'
import { adminPathsOf } from '@/shared/config'
import { formatDateTime, formatWon, useArea } from '@/shared/lib'
import { PageHeader } from '@/shared/ui/PageHeader'
import { ListSkeleton } from '@/shared/ui/Skeleton'
import { StateMessage } from '@/shared/ui/StateMessage'

/** 관리자 주문 상세: 지금 주문 상태(취소면 이유) → 이 주문의 결제 · 주문 정보 */
export function AdminOrderDetailPage() {
  const { orderId = '' } = useParams()
  const adminPaths = adminPathsOf(useArea())
  // 목록에서 넘겨준 상태 탭(?status=)으로 돌아간다
  const listSearch = (useLocation().state as { listSearch?: string } | null)?.listSearch ?? ''
  // 주문 한 건 관리자 API가 없어 전체 주문(최근 100건)에서 찾는다
  const orders = useAdminOrdersQuery(null)
  const payments = useAdminPaymentsQuery()
  const order = orders.data?.content.find((item) => item.id === orderId)
  const related = payments.data?.filter((payment) => payment.orderId === orderId) ?? []

  return (
    <div className="shop-look space-y-6">
      <Link
        to={{ pathname: adminPaths.orders, search: listSearch }}
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
        전체 주문
      </Link>
      <PageHeader
        mockEndpoints={['GET /admin/orders', 'GET /admin/payments']}
        title={`주문 ${orderId}`}
        note="GET /admin/orders (BE #323)에서 이 주문을 찾고, GET /admin/payments (BE #326)에서 이 주문의 결제를 모은다."
      />
      {orders.isPending && <ListSkeleton rows={2} />}
      {orders.isError && <StateMessage tone="error">{getErrorMessage(orders.error)}</StateMessage>}
      {orders.data && !order && (
        <p className="bg-paper-2 text-ink-2 rounded-lg py-12 text-center text-sm">
          최근 주문에서 이 주문을 찾지 못했어요.
        </p>
      )}
      {order && (
        <>
          {/* 주문 상태: 지금 상태를 제목으로, 취소면 아래에 취소 사유 (주문 정보에서는 되풀이하지 않는다) */}
          <section aria-label="주문 상태" className="border-rule space-y-1 rounded-lg border p-5">
            <h2 className="text-page">{ORDER_STATUS_LABEL[order.status]}</h2>
            {order.cancelReason && (
              <p className="text-ink-2 text-sm">{CANCEL_REASON_LABEL[order.cancelReason]}</p>
            )}
          </section>

          {/* 넓은 화면: 왼쪽 이 주문의 결제, 오른쪽 주문 정보 */}
          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_17rem]">
            <section aria-label="이 주문의 결제" className="space-y-3">
              <h2 className="text-section">
                이 주문의 결제
                {payments.data && (
                  <span className="text-ink-3 figure ml-2 text-sm font-medium">
                    {related.length}건
                  </span>
                )}
              </h2>
              {payments.isPending && <StateMessage>결제 기록을 불러오는 중…</StateMessage>}
              {payments.isError && (
                <StateMessage tone="error">{getErrorMessage(payments.error)}</StateMessage>
              )}
              {payments.data && related.length === 0 && (
                <p className="bg-paper-2 text-ink-2 rounded-lg px-4 py-8 text-center text-sm">
                  결제 기록이 없어요. 결제 전에 취소됐거나 아직 처리 중이에요.
                </p>
              )}
              {related.length > 0 && (
                <ul className="divide-rule border-rule divide-y border-y">
                  {related.map((payment) => {
                    const issue = paymentIssueNote(payment)
                    return (
                      <li
                        key={payment.id}
                        className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 text-sm"
                      >
                        <Link
                          to={adminPaths.payment(payment.id)}
                          className="figure hover:text-signal inline-flex min-h-8 items-center font-semibold underline-offset-4 transition-colors hover:underline"
                        >
                          {`결제 ${payment.id}`}
                        </Link>
                        <PaymentStatusTag status={payment.status} />
                        <span className="figure text-ink-2">
                          {formatDateTime(payment.paidAt ?? payment.createdAt)}
                        </span>
                        <span className="figure ml-auto font-semibold">
                          {formatWon(payment.amount)}
                        </span>
                        {issue && <p className="text-ink-2 w-full text-[13px]">{issue}</p>}
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
            <aside
              aria-label="주문 정보"
              className="border-rule space-y-1.5 rounded-lg border p-5 text-sm"
            >
              <h2 className="text-[15px] font-bold">주문 정보</h2>
              <dl className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-2 gap-y-1">
                <dt className="text-ink-3">회원</dt>
                <dd>
                  <Link to={adminPaths.member(order.memberId)} className="shop-link figure">
                    {`회원 ${order.memberId}`}
                  </Link>
                </dd>
                <dt className="text-ink-3">주문 일시</dt>
                <dd className="figure">{formatDateTime(order.orderedAt)}</dd>
                <dt className="text-ink-3">상품 수</dt>
                <dd className="figure">{order.itemCount}개</dd>
                <dt className="text-ink-3">금액</dt>
                <dd className="figure font-semibold">{formatWon(order.totalAmount)}</dd>
              </dl>
            </aside>
          </div>
        </>
      )}
    </div>
  )
}
