import { arr, nullable, obj, str } from '@/shared/api'

export const deliveryTrackingShape = obj({
  carrier: nullable(str),
  trackingNumber: nullable(str),
  events: arr(obj({ time: str, location: nullable(str), status: str })),
})
