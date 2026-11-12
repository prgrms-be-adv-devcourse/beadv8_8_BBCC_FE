import { arr, nullable, obj, str } from '@/shared/api'

export const deliveryTrackingShape = obj({
  carrier: str,
  trackingNumber: str,
  events: arr(obj({ time: str, location: nullable(str), status: str })),
})
