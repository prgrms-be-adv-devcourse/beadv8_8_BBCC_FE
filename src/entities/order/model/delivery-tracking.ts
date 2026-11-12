export type DeliveryTrackingEvent = {
  /** 한국 시간 「yyyy-mm-dd hh:mm」 */
  time: string
  location: string | null
  /** 택배 조회 상태 코드 (라벨은 trackingStatusLabel) */
  status: string
}

export type DeliveryTracking = {
  carrier: string
  trackingNumber: string
  /** 최신이 먼저 */
  events: DeliveryTrackingEvent[]
}
