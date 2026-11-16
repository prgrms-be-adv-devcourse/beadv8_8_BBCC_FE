import { bool, num, obj, str } from '@/shared/api'

const rateLimitShape = obj({ capacity: num, period: str })

export const rateLimitSettingsShape = obj({
  enabled: bool,
  client: rateLimitShape,
  total: rateLimitShape,
})
