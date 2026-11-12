/** GET /orders/{orderId}/deliveries/{deliveryId}/tracking 응답 (BE #1320). events는 최신이 먼저 */
export type DeliveryTrackingDto = {
  /** 택배사 코드 */
  carrier: string
  trackingNumber: string
  events: {
    time: string
    /** 장소 이름 */
    location: string | null
    /** 택배 조회 상태 코드 (IN_TRANSIT · OUT_FOR_DELIVERY · DELIVERED 등) */
    status: string
  }[]
}
