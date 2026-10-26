import { cn } from '@/shared/lib'
import { PAYMENT_STATUS_LABEL, type PaymentStatus } from '../model/payment'

type PaymentStatusTagProps = { status: PaymentStatus }

/** 결제 상태 꼬리표: 글자는 회색, 결제 실패만 빨강 */
export function PaymentStatusTag({ status }: PaymentStatusTagProps) {
  return (
    <span
      className={cn(
        'bg-paper-2 inline-flex h-6 items-center rounded-sm px-2 text-xs font-semibold whitespace-nowrap',
        status === 'FAILED' ? 'text-destructive' : 'text-ink-2',
      )}
    >
      {PAYMENT_STATUS_LABEL[status]}
    </span>
  )
}
