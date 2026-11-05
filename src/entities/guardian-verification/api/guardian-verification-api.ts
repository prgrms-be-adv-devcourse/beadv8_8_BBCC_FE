import { apiClient, expectShape } from '@/shared/api'
import type { GuardianVerificationDto } from './guardian-verification.dto'
import { guardianVerificationShape } from './guardian-verification.shape'

export const guardianVerificationApi = {
  get: () =>
    apiClient
      .get<GuardianVerificationDto>('/guardian-verification')
      .then(expectShape(guardianVerificationShape)),
  /** 서버가 이 인증 ID로 포트원에 결과를 다시 조회한다 */
  verify: (identityVerificationId: string) =>
    apiClient
      .post<GuardianVerificationDto>('/guardian-verification', { identityVerificationId })
      .then(expectShape(guardianVerificationShape)),
}
