import { getErrorMessage } from '@/shared/api'
import {
  PAYMENT_FAILURE_LABEL,
  PAYMENT_STATUS_LABEL,
  type Payment,
  type PaymentCheck,
} from '@/entities/payment'
import { cn, formatDateTime, formatWon } from '@/shared/lib'
import { StateMessage } from '@/shared/ui/StateMessage'

const CHECK_WORD: Record<PaymentCheck['result'], string> = {
  MATCH: '일치',
  WAITING: '기다리는 중',
  MISMATCH: '불일치',
  INFO: '',
}

type PaymentSummaryProps = {
  totalAmount: number
  payment: Payment | null
  check: PaymentCheck | null
  pending: boolean
  error: unknown
}

/** 오른쪽 결제 정보: 결제 금액 · 수단 · 일시 · 상태, 맨 아래 결제 기록과 맞춰 본 결과 한 줄 */
export function PaymentSummary({
  totalAmount,
  payment,
  check,
  pending,
  error,
}: PaymentSummaryProps) {
  return (
    <section aria-label="결제 정보" className="border-rule space-y-4 rounded-lg border p-5">
      <h2 className="text-[15px] font-bold">결제 정보</h2>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-ink-3">결제 수단</dt>
          <dd>예치금</dd>
        </div>
        {payment && (
          <>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-3">결제 상태</dt>
              <dd className={cn(payment.status === 'FAILED' && 'text-destructive')}>
                {PAYMENT_STATUS_LABEL[payment.status]}
                {payment.failureCode && ` (${PAYMENT_FAILURE_LABEL[payment.failureCode]})`}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-3">{payment.paidAt ? '결제 일시' : '시도 일시'}</dt>
              <dd className="figure">{formatDateTime(payment.paidAt ?? payment.createdAt)}</dd>
            </div>
            {payment.refundedAmount > 0 && (
              <div className="flex justify-between gap-4">
                <dt className="text-ink-3">환불</dt>
                <dd className="figure">{formatWon(payment.refundedAmount)}</dd>
              </div>
            )}
          </>
        )}
        <div className="border-rule flex items-baseline justify-between gap-4 border-t pt-3">
          <dt className="font-semibold">결제 금액</dt>
          <dd className="figure text-xl font-bold">{formatWon(totalAmount)}</dd>
        </div>
      </dl>
      {pending && <StateMessage>결제 기록을 불러오는 중…</StateMessage>}
      {Boolean(error) && <StateMessage tone="error">{getErrorMessage(error)}</StateMessage>}
      {check && !pending && !error && (
        <p
          role="status"
          aria-label="결제 확인"
          className={cn(
            'bg-paper-2 rounded-md px-3 py-2 text-xs',
            check.result === 'MISMATCH' ? 'text-destructive' : 'text-ink-2',
          )}
        >
          <span className="font-semibold">
            결제 확인{CHECK_WORD[check.result] && ` ${CHECK_WORD[check.result]}`}
          </span>{' '}
          {check.message}
        </p>
      )}
    </section>
  )
}
