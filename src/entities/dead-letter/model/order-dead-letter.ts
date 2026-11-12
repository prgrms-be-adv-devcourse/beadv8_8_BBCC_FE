import { labelOf } from '@/shared/lib'
import type { OrderDeadLetterDto, OrderDeadLetterSummaryDto } from '../api/order-dead-letter.dto'
import type { ReprocessOutcome } from './dead-letter'

/** BE 주문 DLT 상태. 회원 서비스 모듈과 달리 「확인 후 종료」가 있다 */
export type OrderDeadLetterStatus = 'OPEN' | 'REPROCESSED' | 'CLOSED'

export const ORDER_DEAD_LETTER_STATUS_LABEL: Record<OrderDeadLetterStatus, string> = {
  OPEN: '처리 대기',
  REPROCESSED: '재처리 완료',
  CLOSED: '확인 후 종료',
}

const FAILURE_TYPE_LABEL: Record<string, string> = {
  READ_FAILED: '읽기 실패',
  STORE_FAILED: '보관 실패',
  PROCESS_FAILED: '처리 실패',
}

export type OrderDeadLetterSummary = {
  id: string
  lastReceivedAt: string
  failureType: string
  eventType: string | null
  orderId: string | null
  receivedCount: number
  status: OrderDeadLetterStatus
  isPaymentEvent: boolean
}

export type OrderDeadLetter = Omit<
  OrderDeadLetterDto,
  'deadLetterId' | 'status' | 'paymentEvent'
> & {
  id: string
  status: OrderDeadLetterStatus
  isPaymentEvent: boolean
}

export function toOrderDeadLetterSummary(dto: OrderDeadLetterSummaryDto): OrderDeadLetterSummary {
  return {
    id: dto.deadLetterId,
    lastReceivedAt: dto.lastReceivedAt,
    failureType: labelOf(FAILURE_TYPE_LABEL, dto.failureType),
    eventType: dto.eventType,
    orderId: dto.orderId,
    receivedCount: dto.receivedCount,
    status: dto.status as OrderDeadLetterStatus,
    isPaymentEvent: dto.paymentEvent,
  }
}

export function toOrderDeadLetter(dto: OrderDeadLetterDto): OrderDeadLetter {
  const { deadLetterId, status, paymentEvent, failureType, ...rest } = dto
  return {
    ...rest,
    id: deadLetterId,
    status: status as OrderDeadLetterStatus,
    failureType: labelOf(FAILURE_TYPE_LABEL, failureType),
    isPaymentEvent: paymentEvent,
  }
}

/** 재처리 · 확인 후 종료는 처리 대기일 때만 */
export function canHandleOrderDeadLetter(deadLetter: OrderDeadLetter): boolean {
  return deadLetter.status === 'OPEN'
}

/** 재처리는 성공 · 실패 · 이미 재처리됨 모두 200이라 응답 상태와 횟수로 고른다 (BE OrderDeadLetterService.reprocess) */
export function orderDeadLetterOutcomeOf(
  previousReprocessCount: number,
  result: OrderDeadLetter,
): ReprocessOutcome {
  if (result.status === 'OPEN') return { kind: 'FAILED', failureType: result.lastReprocessResult }
  return result.reprocessCount > previousReprocessCount
    ? { kind: 'REPROCESSED' }
    : { kind: 'ALREADY_REPROCESSED' }
}

export const CLOSE_MEMO_MAX = 500

/** 확인 후 종료 메모 검사 (BE @NotBlank @Size(max = 500)). 괜찮으면 null */
export function closeMemoError(memo: string): string | null {
  if (memo.trim() === '') return '확인한 내용이나 종료 이유를 적어 주세요.'
  if (memo.length > CLOSE_MEMO_MAX) return `${CLOSE_MEMO_MAX}자까지 적을 수 있어요.`
  return null
}

/** 주소의 ?status= → 주문 DLT 상태. 없거나 모르는 값은 처리 대기 */
export function orderDeadLetterStatusOf(value: string | null): OrderDeadLetterStatus {
  return value !== null && Object.hasOwn(ORDER_DEAD_LETTER_STATUS_LABEL, value)
    ? (value as OrderDeadLetterStatus)
    : 'OPEN'
}
