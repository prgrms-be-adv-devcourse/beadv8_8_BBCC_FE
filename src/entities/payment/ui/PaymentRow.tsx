import { formatDateTime, formatWon } from '@/shared/lib'
import { Badge } from '@/shared/ui/badge'
import { PAYMENT_FAILURE_LABEL, PAYMENT_STATUS_LABEL, type Payment } from '../model/payment'

type PaymentRowProps = { payment: Payment }

/** 결제 내역 목록 한 줄 */
export function PaymentRow({ payment }: PaymentRowProps) {
  return (
    <div className="flex items-center justify-between border-t pt-2 text-sm">
      <span>
        주문 {payment.orderId} · {formatDateTime(payment.paidAt ?? payment.createdAt)}
        {payment.failureCode && ` · ${PAYMENT_FAILURE_LABEL[payment.failureCode]}`}
      </span>
      <span className="flex items-center gap-2">
        <span className="font-semibold">{formatWon(payment.amount)}</span>
        <Badge variant={payment.status === 'COMPLETED' ? 'success' : 'muted'}>
          {PAYMENT_STATUS_LABEL[payment.status]}
        </Badge>
      </span>
    </div>
  )
}
