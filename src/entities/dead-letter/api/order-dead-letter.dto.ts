/** GET /admin/orders/dead-letters 한 줄 (BE OrderDeadLetterSummaryResponse #601). 관련 주문이 없으면 orderId null */
export type OrderDeadLetterSummaryDto = {
  deadLetterId: string
  lastReceivedAt: string
  /** READ_FAILED · STORE_FAILED · PROCESS_FAILED */
  failureType: string
  eventType: string | null
  orderId: string | null
  receivedCount: number
  /** OPEN · REPROCESSED · CLOSED */
  status: string
  /** 결제 토픽에서 온 메시지 (목록 맨 앞, #632) */
  paymentEvent: boolean
}

/** GET /admin/orders/dead-letters/{id} (BE OrderDeadLetterResponse #601). 저장한 칸 전체 + 관련 주문 지금 상태 + 권장 조치 */
export type OrderDeadLetterDto = {
  deadLetterId: string
  sourceTopic: string
  sourcePartition: number
  sourceOffset: number
  messageKey: string | null
  eventType: string | null
  eventId: string | null
  payload: string | null
  producer: string | null
  occurredAt: string | null
  aggregateId: string | null
  correlationId: string | null
  orderId: string | null
  orderStatus: string | null
  failureType: string
  exceptionClass: string | null
  exceptionMessage: string | null
  stackTraceHead: string | null
  firstReceivedAt: string
  lastReceivedAt: string
  receivedCount: number
  status: string
  handledBy: string | null
  handledAt: string | null
  memo: string | null
  reprocessCount: number
  lastReprocessedAt: string | null
  lastReprocessResult: string | null
  recommendedAction: string | null
  paymentEvent: boolean
}
