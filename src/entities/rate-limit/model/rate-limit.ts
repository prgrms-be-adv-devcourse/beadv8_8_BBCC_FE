/** 한도 하나: periodMs 동안 capacity건까지 받는다. capacity는 한꺼번에 몰려도 받아 주는 최대치이기도 하다 */
export type RateLimit = { capacity: number; periodMs: number }

/** Gateway 요청 수 제한 설정 (화면용) */
export type RateLimitSettings = {
  isEnabled: boolean
  client: RateLimit
  total: RateLimit
}

/** 바꿀 수 있는 한도 두 가지. 검색 · 챗봇 한도는 배포로만 바꾼다 (BE #1421) */
export type RateLimitTarget = 'client' | 'total'

export const RATE_LIMIT_TARGET_LABEL: Record<RateLimitTarget, string> = {
  client: '사용자별 한도',
  total: '전체 한도',
}

export const RATE_LIMIT_TARGET_DESCRIPTION: Record<RateLimitTarget, string> = {
  client: '로그인한 사용자마다(로그인하지 않았으면 IP마다) 세요. 넘은 사용자만 잠시 막아요.',
  total: '모든 요청을 합쳐 세요. 넘으면 모든 사용자를 잠시 막아 서버를 보호해요.',
}

export type PeriodUnit = 'hour' | 'minute' | 'second' | 'millisecond'

/** 큰 단위부터. 표시 · 입력은 나누어떨어지는 가장 큰 단위를 고른다 */
export const PERIOD_UNITS: readonly PeriodUnit[] = ['hour', 'minute', 'second', 'millisecond']

export const PERIOD_UNIT_MS: Record<PeriodUnit, number> = {
  hour: 3_600_000,
  minute: 60_000,
  second: 1000,
  millisecond: 1,
}

export const PERIOD_UNIT_LABEL: Record<PeriodUnit, string> = {
  hour: '시간',
  minute: '분',
  second: '초',
  millisecond: '밀리초',
}
