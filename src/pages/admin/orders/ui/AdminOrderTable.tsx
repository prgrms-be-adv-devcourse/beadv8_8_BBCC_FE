import { Link } from 'react-router'
import { CANCEL_REASON_LABEL, OrderStatusTag, type AdminOrder } from '@/entities/order'
import { formatDateTime, formatWon } from '@/shared/lib'

type AdminOrderTableProps = {
  orders: AdminOrder[]
  orderHref: (orderId: string) => string
  memberHref: (memberId: string) => string
  /** 상세에서 목록으로 돌아올 때 지금 탭(?status=)을 되살린다 */
  listSearch: string
}

const HEAD = 'py-2.5 pr-4 font-medium whitespace-nowrap last:pr-0'
const CELL = 'py-3 pr-4 whitespace-nowrap last:pr-0'

/** 전체 주문 표: 주문(상세 링크) · 회원 · 주문 일시 · 상품 수 · 금액 · 상태 · 취소 사유. 좁으면 표 안에서 옆으로 민다 */
export function AdminOrderTable({
  orders,
  orderHref,
  memberHref,
  listSearch,
}: AdminOrderTableProps) {
  return (
    <div className="overflow-x-auto">
      <table aria-label="전체 주문" className="w-full min-w-[44rem] text-left text-sm">
        <thead>
          <tr className="border-rule text-ink-3 border-b text-[13px]">
            <th scope="col" className={HEAD}>
              주문
            </th>
            <th scope="col" className={HEAD}>
              회원
            </th>
            <th scope="col" className={HEAD}>
              주문 일시
            </th>
            <th scope="col" className={`${HEAD} text-right`}>
              상품 수
            </th>
            <th scope="col" className={`${HEAD} text-right`}>
              금액
            </th>
            <th scope="col" className={HEAD}>
              상태
            </th>
            <th scope="col" className={HEAD}>
              취소 사유
            </th>
          </tr>
        </thead>
        <tbody className="divide-rule border-rule divide-y border-b">
          {orders.map((order) => (
            <tr key={order.id} className="align-middle">
              <td className={CELL}>
                <Link
                  to={orderHref(order.id)}
                  state={{ listSearch }}
                  className="figure hover:text-signal inline-flex min-h-8 items-center font-semibold underline-offset-4 transition-colors hover:underline"
                >
                  {`주문 ${order.id}`}
                </Link>
              </td>
              <td className={CELL}>
                <Link
                  to={memberHref(order.memberId)}
                  className="figure text-ink-2 hover:text-ink underline-offset-4 transition-colors hover:underline"
                >
                  {`회원 ${order.memberId}`}
                </Link>
              </td>
              <td className={`${CELL} figure text-ink-2`}>{formatDateTime(order.orderedAt)}</td>
              <td className={`${CELL} figure text-right`}>{order.itemCount}개</td>
              <td className={`${CELL} figure text-right font-semibold`}>
                {formatWon(order.totalAmount)}
              </td>
              <td className={CELL}>
                <OrderStatusTag status={order.status} />
              </td>
              <td className="text-ink-2 min-w-56 py-3 text-[13px]">
                {order.cancelReason ? CANCEL_REASON_LABEL[order.cancelReason] : ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
