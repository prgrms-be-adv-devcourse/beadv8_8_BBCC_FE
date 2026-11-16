/** 한도 하나: period 동안 capacity건 (백엔드 RateLimitProperties.Limit). period는 Java Duration의 ISO-8601 (예: PT1S · PT1M) */
export type RateLimitDto = { capacity: number; period: string }

/**
 * Gateway 요청 수 제한 설정 (백엔드 RateLimitSettings.Snapshot). GET · PUT /admin/gateway/rate-limit 응답.
 * client는 로그인한 주체(없으면 IP)마다, total은 모든 요청을 합친 한도
 */
export type RateLimitSettingsDto = {
  enabled: boolean
  client: RateLimitDto
  total: RateLimitDto
}
