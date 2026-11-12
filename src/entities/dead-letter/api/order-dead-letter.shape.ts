import { bool, nullable, num, obj, pageOf, str } from '@/shared/api'

// BE AdminOrderDeadLetterController (#601). 상태 · 실패 유형은 늘어날 수 있어 글자로 받는다
export const orderDeadLetterSummaryShape = obj({
  deadLetterId: str,
  lastReceivedAt: str,
  failureType: str,
  eventType: nullable(str),
  orderId: nullable(str),
  receivedCount: num,
  status: str,
  paymentEvent: bool,
})

export const orderDeadLetterPageShape = pageOf(orderDeadLetterSummaryShape)

export const orderDeadLetterShape = obj({
  deadLetterId: str,
  sourceTopic: str,
  sourcePartition: num,
  sourceOffset: num,
  messageKey: nullable(str),
  eventType: nullable(str),
  eventId: nullable(str),
  payload: nullable(str),
  producer: nullable(str),
  occurredAt: nullable(str),
  aggregateId: nullable(str),
  correlationId: nullable(str),
  orderId: nullable(str),
  orderStatus: nullable(str),
  failureType: str,
  exceptionClass: nullable(str),
  exceptionMessage: nullable(str),
  stackTraceHead: nullable(str),
  firstReceivedAt: str,
  lastReceivedAt: str,
  receivedCount: num,
  status: str,
  handledBy: nullable(str),
  handledAt: nullable(str),
  memo: nullable(str),
  reprocessCount: num,
  lastReprocessedAt: nullable(str),
  lastReprocessResult: nullable(str),
  recommendedAction: nullable(str),
  paymentEvent: bool,
})
