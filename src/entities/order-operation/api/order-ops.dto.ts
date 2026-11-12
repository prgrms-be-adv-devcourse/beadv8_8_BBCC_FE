/** GET /admin/orders/stuck/summary (BE #445): 종류 → 건수, 모든 종류(0 포함) */
export type StuckSummaryDto = Record<string, number>

/** GET /admin/orders/stuck?kind= 한 줄 (BE StuckOrderResponse #445 · #602 · #926) */
export type StuckOrderDto = {
  kind: string
  /** 관련 주문 ID. 아웃박스 멈춤에서 메시지 키가 주문 ID가 아니면 null */
  orderId: string | null
  targetType: string
  targetId: string | null
  status: string
  /** 멈춘 것으로 보기 시작한 시각 */
  since: string
  outbox: {
    outboxId: string
    eventType: string
    eventId: string
    attemptCount: number
    createdAt: string
    lastError: string | null
    backlogCount: number
    quarantinedAt: string | null
  } | null
  /** AI 진단 메모(제안일 뿐, 조치는 관리자). 없으면 null */
  aiMemo: {
    summary: string
    recommendedAction: string
    /** LOW · MEDIUM · HIGH */
    confidence: string
    provider: string
    model: string
    createdAt: string
  } | null
}
