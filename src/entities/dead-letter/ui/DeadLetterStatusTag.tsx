import { cn } from '@/shared/lib'
import { DEAD_LETTER_STATUS_LABEL, type DeadLetterStatus } from '../model/dead-letter'

type DeadLetterStatusTagProps = { status: DeadLetterStatus }

/** 처리 실패 메시지 상태 꼬리표: 처리 대기는 빨강, 재처리 완료는 회색 */
export function DeadLetterStatusTag({ status }: DeadLetterStatusTagProps) {
  return (
    <span
      className={cn(
        'bg-paper-2 inline-flex h-6 items-center rounded-sm px-2 text-xs font-semibold whitespace-nowrap',
        status === 'OPEN' ? 'text-destructive' : 'text-ink-2',
      )}
    >
      {DEAD_LETTER_STATUS_LABEL[status]}
    </span>
  )
}
