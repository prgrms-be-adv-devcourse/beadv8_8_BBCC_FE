import { getErrorMessage } from '@/shared/api'
import { cn, formatDateTime, formatWon } from '@/shared/lib'
import { Badge } from '@/shared/ui/badge'
import { Card, CardTitle } from '@/shared/ui/card'
import { StateMessage } from '@/shared/ui/StateMessage'
import {
  PAYMENT_FAILURE_LABEL,
  PAYMENT_STATUS_LABEL,
  type Payment,
  type PaymentCheck,
} from '../model/payment'

const CHECK_STYLE: Record<PaymentCheck['result'], string> = {
  MATCH: 'border-green-600 bg-green-50 text-green-800',
  WAITING: 'border-primary/40 bg-primary/5 text-primary',
  MISMATCH: 'border-destructive bg-destructive/10 text-destructive',
  INFO: 'border-muted bg-muted text-muted-foreground',
}
const CHECK_TITLE: Record<PaymentCheck['result'], string> = {
  MATCH: '결제 확인: 일치',
  WAITING: '결제 확인: 기다리는 중',
  MISMATCH: '결제 확인: 불일치',
  INFO: '결제 확인',
}

type PaymentCardProps = {
  payment: Payment | null
  check: PaymentCheck
  pending: boolean
  error: unknown
}

/** 주문의 결제 기록 (결제 도메인) + 주문 상태와 맞춰 본 결과 */
export function PaymentCard({ payment, check, pending, error }: PaymentCardProps) {
  return (
    <Card className="space-y-2">
      <CardTitle>결제 내역</CardTitle>
      {pending && <StateMessage>결제 기록을 불러오는 중…</StateMessage>}
      {Boolean(error) && <StateMessage tone="error">{getErrorMessage(error)}</StateMessage>}
      {payment && (
        <div className="space-y-1 text-sm">
          <p className="flex items-center gap-2">
            <span>결제 #{payment.id}</span>
            <Badge variant={payment.status === 'COMPLETED' ? 'success' : 'muted'}>
              {PAYMENT_STATUS_LABEL[payment.status]}
            </Badge>
            <span className="ml-auto font-semibold">{formatWon(payment.amount)}</span>
          </p>
          <p className="text-muted-foreground">
            예치금 결제 ·{' '}
            {payment.paidAt
              ? `${formatDateTime(payment.paidAt)} 결제`
              : `${formatDateTime(payment.createdAt)} 시도`}
            {payment.failureCode && ` · ${PAYMENT_FAILURE_LABEL[payment.failureCode]}`}
            {payment.refundedAmount > 0 && ` · 환불 ${formatWon(payment.refundedAmount)}`}
          </p>
        </div>
      )}
      {!pending && !error && (
        <p
          role="status"
          aria-label="결제 확인"
          className={cn('rounded-md border px-3 py-2 text-sm', CHECK_STYLE[check.result])}
        >
          <span className="font-semibold">{CHECK_TITLE[check.result]}</span> · {check.message}
        </p>
      )}
    </Card>
  )
}
