export type DeliveryTrackingEvent = {
  /** 한국 시간 「yyyy-mm-dd hh:mm」 */
  time: string
  location: string | null
  /** 택배 조회 상태 코드 (라벨은 trackingStatusLabel) */
  status: string
}

export type DeliveryTracking = {
  /** 택배사 코드. 운송장이 없으면 null일 수 있다 */
  carrier: string | null
  trackingNumber: string | null
  /** 최신이 먼저 */
  events: DeliveryTrackingEvent[]
}
