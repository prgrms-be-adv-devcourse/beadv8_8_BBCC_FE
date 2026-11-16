import type { RateLimit, RateLimitTarget } from '@/entities/rate-limit'
import type { RateLimitSettingsRequestDto } from '../api/rate-limit.dto'

/** 한 번에 하나만 바꾼다: 켜고 끄기, 또는 한도 하나. 보내지 않은 칸은 서버 값을 그대로 둔다 */
export type RateLimitChange = { isEnabled: boolean } | { target: RateLimitTarget; limit: RateLimit }

export function toRateLimitRequest(change: RateLimitChange): RateLimitSettingsRequestDto {
  if ('isEnabled' in change) return { enabled: change.isEnabled }
  // 초 단위 ISO-8601. 밀리초는 소수로 쓴다 (예: 1500 → PT1.5S). 서버는 PT1M처럼 줄여 돌려준다
  const period = `PT${change.limit.periodMs / 1000}S`
  return { [change.target]: { capacity: change.limit.capacity, period } }
}
