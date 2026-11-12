import { cn } from '@/shared/lib'
import type { DeadLetterStatus } from '../model/dead-letter'
import {
  ORDER_DEAD_LETTER_STATUS_LABEL,
  type OrderDeadLetterStatus,
} from '../model/order-dead-letter'

type DeadLetterStatusTagProps = { status: DeadLetterStatus | OrderDeadLetterStatus }

/** 처리 실패 메시지 상태 꼬리표: 처리 대기는 빨강, 재처리 완료 · 확인 후 종료는 회색 (주문 상태표가 모듈 상태표를 포함) */
export function DeadLetterStatusTag({ status }: DeadLetterStatusTagProps) {
  return (
    <span
      className={cn(
        'bg-paper-2 inline-flex h-6 items-center rounded-sm px-2 text-xs font-semibold whitespace-nowrap',
        status === 'OPEN' ? 'text-destructive' : 'text-ink-2',
      )}
    >
      {ORDER_DEAD_LETTER_STATUS_LABEL[status]}
    </span>
  )
}
