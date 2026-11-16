import type { RateLimitDto, RateLimitSettingsDto } from '../api/rate-limit.dto'
import type { RateLimit, RateLimitSettings } from './rate-limit'

// Java Duration.toString: 일(D)도 시간으로 쓰므로 시 · 분 · 초(소수 9자리까지)만 나온다
const DURATION = /^PT(?=\d)(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)(?:\.(\d{1,9}))?S)?$/

/** BE도 Duration.toMillis로 밀리초 아래를 버려 쓴다 */
function toMillis(period: string): number {
  const match = DURATION.exec(period)
  if (!match) throw new Error(`읽을 수 없는 기간이에요: ${period}`)
  const [, hours = '0', minutes = '0', seconds = '0', fraction = ''] = match
  const millis = Number(fraction.slice(0, 3).padEnd(3, '0'))
  return (Number(hours) * 60 + Number(minutes)) * 60_000 + Number(seconds) * 1000 + millis
}

function toRateLimit(dto: RateLimitDto): RateLimit {
  return { capacity: dto.capacity, periodMs: toMillis(dto.period) }
}

export function toRateLimitSettings(dto: RateLimitSettingsDto): RateLimitSettings {
  return {
    isEnabled: dto.enabled,
    client: toRateLimit(dto.client),
    total: toRateLimit(dto.total),
  }
}
