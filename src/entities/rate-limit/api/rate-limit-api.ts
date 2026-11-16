import { apiClient, expectShape } from '@/shared/api'
import type { RateLimitSettingsDto } from './rate-limit.dto'
import { rateLimitSettingsShape } from './rate-limit.shape'

/** Gateway 요청 수 제한 설정 조회 (BE #1421 RateLimitSettings 라우트). 변경은 features/change-rate-limit */
export const rateLimitApi = {
  /** 지금 이 Gateway가 쓰는 설정 */
  get: () =>
    apiClient
      .get<RateLimitSettingsDto>('/admin/gateway/rate-limit')
      .then(expectShape(rateLimitSettingsShape)),
}
