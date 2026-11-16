type RateLimitDto = { capacity: number; period: string }

/**
 * PUT /admin/gateway/rate-limit (백엔드 RateLimitSettingsGatewayFilterFactory.Request). 보낸 칸만 바뀌고 하나는 있어야 한다.
 * 한도는 capacity(1 이상) · period(ISO-8601, 1ms 이상)를 모두 보낸다. 어기면 400
 */
export type RateLimitSettingsRequestDto = {
  enabled?: boolean
  client?: RateLimitDto
  total?: RateLimitDto
}

/** PUT 응답: 바뀐 뒤 설정 전체 (GET과 같은 RateLimitSettings.Snapshot). 모양은 엔티티 rateLimitSettingsShape로 검사한다 */
export type RateLimitSettingsDto = {
  enabled: boolean
  client: RateLimitDto
  total: RateLimitDto
}
