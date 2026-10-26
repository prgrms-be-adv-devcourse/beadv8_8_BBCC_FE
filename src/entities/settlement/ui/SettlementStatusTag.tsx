import { cn } from '@/shared/lib'
import { SETTLEMENT_STATUS_LABEL, type SettlementStatus } from '../model/settlement'

const STATUS_TONE: Record<SettlementStatus, string> = {
  COMPLETED: 'text-ink-2',
  PAID: 'text-signal',
  FAILED: 'text-destructive',
}

type SettlementStatusTagProps = { status: SettlementStatus }

/** 정산서 상태 꼬리표: 지급 완료만 자두, 실패는 빨강 */
export function SettlementStatusTag({ status }: SettlementStatusTagProps) {
  return (
    <span
      className={cn(
        'bg-paper-2 inline-flex h-6 items-center rounded-sm px-2 text-xs font-semibold whitespace-nowrap',
        STATUS_TONE[status],
      )}
    >
      {SETTLEMENT_STATUS_LABEL[status]}
    </span>
  )
}
