import {
  PAYMENT_FAILURE_LABEL,
  PAYMENT_STATUS_LABEL,
  useAdminPaymentsQuery,
} from '@/entities/payment'
import { getErrorMessage } from '@/shared/api'
import { formatDateTime, formatWon } from '@/shared/lib'
import { Badge } from '@/shared/ui/badge'
import { Card } from '@/shared/ui/card'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StateMessage } from '@/shared/ui/StateMessage'

/** 관리자 전체 결제 · 환불 조회 (기획서 8장 보완 · 목) */
export function AdminPaymentsPage() {
  const payments = useAdminPaymentsQuery()

  return (
    <div className="space-y-4">
      <PageHeader
        title="전체 결제 · 환불"
        description="모든 회원의 주문 결제 · 환불 기록을 봐요."
        note="GET /admin/payments는 백엔드에 없어 목이에요. 이 탭에서 각 회원이 받은 결제 내역 응답으로 만들어요."
      />
      {payments.isPending && <StateMessage>불러오는 중…</StateMessage>}
      {payments.isError && (
        <StateMessage tone="error">{getErrorMessage(payments.error)}</StateMessage>
      )}
      {payments.data?.length === 0 && <StateMessage>결제 기록이 없어요.</StateMessage>}
      {payments.data?.map((payment) => (
        <Card key={payment.id} className="flex flex-wrap items-center gap-3 text-sm">
          <span className="font-medium">결제 {payment.id}</span>
          <span className="text-muted-foreground">주문 {payment.orderId}</span>
          <span className="text-muted-foreground">회원 {payment.memberId}</span>
          <span className="text-muted-foreground">
            {formatDateTime(payment.paidAt ?? payment.createdAt)}
          </span>
          <span className="ml-auto font-semibold">{formatWon(payment.amount)}</span>
          <Badge variant={payment.status === 'COMPLETED' ? 'success' : 'muted'}>
            {PAYMENT_STATUS_LABEL[payment.status]}
          </Badge>
          {(payment.failureCode || payment.refundedAmount > 0) && (
            <span className="text-muted-foreground w-full text-xs">
              {payment.failureCode && PAYMENT_FAILURE_LABEL[payment.failureCode]}
              {payment.refundedAmount > 0 && `환불 ${formatWon(payment.refundedAmount)}`}
            </span>
          )}
        </Card>
      ))}
    </div>
  )
}
