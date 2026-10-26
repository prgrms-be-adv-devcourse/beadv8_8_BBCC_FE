import { Link } from 'react-router'
import { paymentIssueNote, PaymentStatusTag, type AdminPayment } from '@/entities/payment'
import { formatDateTime, formatWon } from '@/shared/lib'

type AdminPaymentTableProps = {
  payments: AdminPayment[]
  paymentHref: (paymentId: string) => string
  orderHref: (orderId: string) => string
  memberHref: (memberId: string) => string
}

const HEAD = 'py-2.5 pr-4 font-medium whitespace-nowrap last:pr-0'
const CELL = 'py-3 pr-4 whitespace-nowrap'
const SUB_LINK =
  'figure text-ink-2 hover:text-ink underline-offset-4 transition-colors hover:underline'

/** 전체 결제 표: 결제(상세 링크) · 주문 · 회원 · 일시 · 금액 · 상태 · 실패 · 환불. 좁으면 표 안에서 옆으로 민다 */
export function AdminPaymentTable({
  payments,
  paymentHref,
  orderHref,
  memberHref,
}: AdminPaymentTableProps) {
  return (
    <div className="overflow-x-auto">
      <table aria-label="전체 결제" className="w-full min-w-[44rem] text-left text-sm">
        <thead>
          <tr className="border-rule text-ink-3 border-b text-[13px]">
            <th scope="col" className={HEAD}>
              결제
            </th>
            <th scope="col" className={HEAD}>
              주문
            </th>
            <th scope="col" className={HEAD}>
              회원
            </th>
            <th scope="col" className={HEAD}>
              일시
            </th>
            <th scope="col" className={`${HEAD} text-right`}>
              금액
            </th>
            <th scope="col" className={HEAD}>
              상태
            </th>
            <th scope="col" className={HEAD}>
              실패 · 환불
            </th>
          </tr>
        </thead>
        <tbody className="divide-rule border-rule divide-y border-b">
          {payments.map((payment) => (
            <tr key={payment.id} className="align-middle">
              <td className={CELL}>
                <Link
                  to={paymentHref(payment.id)}
                  className="figure hover:text-signal inline-flex min-h-8 items-center font-semibold underline-offset-4 transition-colors hover:underline"
                >
                  {`결제 ${payment.id}`}
                </Link>
              </td>
              <td className={CELL}>
                <Link to={orderHref(payment.orderId)} className={SUB_LINK}>
                  {`주문 ${payment.orderId}`}
                </Link>
              </td>
              <td className={CELL}>
                <Link to={memberHref(payment.memberId)} className={SUB_LINK}>
                  {`회원 ${payment.memberId}`}
                </Link>
              </td>
              <td className={`${CELL} figure text-ink-2`}>
                {formatDateTime(payment.paidAt ?? payment.createdAt)}
              </td>
              <td className={`${CELL} figure text-right font-semibold`}>
                {formatWon(payment.amount)}
              </td>
              <td className={CELL}>
                <PaymentStatusTag status={payment.status} />
              </td>
              <td className="text-ink-2 min-w-40 py-3 text-[13px]">{paymentIssueNote(payment)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
