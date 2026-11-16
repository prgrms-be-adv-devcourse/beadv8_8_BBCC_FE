import type { DeliveryTrackingDto } from '../api/delivery-tracking.dto'
import type { DeliveryTracking } from './delivery-tracking'

const KST_OFFSET_MS = 9 * 3600e3

/** 시각을 한국 시간 「yyyy-mm-dd hh:mm」으로. BE는 오프셋 없는 한국 시각을 주고, 오프셋(Z · +09:00)이 붙어 오면 바꾼다 */
function toKstMinute(value: string): string {
  if (/(Z|[+-]\d{2}:?\d{2})$/.test(value)) {
    const time = Date.parse(value)
    if (!Number.isNaN(time))
      return new Date(time + KST_OFFSET_MS).toISOString().slice(0, 16).replace('T', ' ')
  }
  return value.replace('T', ' ').slice(0, 16)
}

export function toDeliveryTracking(dto: DeliveryTrackingDto): DeliveryTracking {
  return {
    carrier: dto.carrier,
    trackingNumber: dto.trackingNumber,
    events: dto.events.map((event) => ({
      time: toKstMinute(event.time),
      location: event.location?.trim() || null,
      status: event.status,
    })),
  }
}
