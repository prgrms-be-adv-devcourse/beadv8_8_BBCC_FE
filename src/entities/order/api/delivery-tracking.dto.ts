/**
 * GET /orders/{orderId}/deliveries/{sellerOrderId}/tracking 응답 (BE #1320). events는 최신이 먼저.
 * 운송장 없음 · 조회 못 하는 택배사(DUMMY)도 200 + 빈 events
 */
export type DeliveryTrackingDto = {
  /** 주문 택배사 코드 (HANJIN · CJ · EPOST · LOTTE · LOGEN) */
  carrier: string | null
  trackingNumber: string | null
  events: {
    /** 한국 시각, 오프셋 없음 (LocalDateTime) */
    time: string
    /** 장소 이름 */
    location: string | null
    /** 택배 조회 상태 코드 (IN_TRANSIT · OUT_FOR_DELIVERY · DELIVERED 등) */
    status: string
  }[]
}
