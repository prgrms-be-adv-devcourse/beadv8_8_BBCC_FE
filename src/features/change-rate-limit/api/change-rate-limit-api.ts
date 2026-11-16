import { rateLimitSettingsShape } from '@/entities/rate-limit'
import { apiClient, expectShape } from '@/shared/api'
import type { RateLimitSettingsDto, RateLimitSettingsRequestDto } from './rate-limit.dto'

/** 요청 수 제한 설정 변경 (BE #1421). 조회는 entities/rate-limit */
export const changeRateLimitApi = {
  /** 200 + 바뀐 뒤 설정 전체. 다른 Gateway에는 2초 안에 퍼진다. 저장소(Redis)에 쓰지 못하면 503 */
  change: (request: RateLimitSettingsRequestDto) =>
    apiClient
      .put<RateLimitSettingsDto>('/admin/gateway/rate-limit', request)
      .then(expectShape(rateLimitSettingsShape)),
}
