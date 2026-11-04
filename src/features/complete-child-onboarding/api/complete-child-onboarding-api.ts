import { apiClient } from '@/shared/api'
import type { ChildConsentRequestDto } from './child-consent.dto'
export const completeChildOnboardingApi = {
  notice: () => apiClient.post('/child/onboarding/notice'),
  consent: (body: ChildConsentRequestDto) => apiClient.post('/child/consents', body),
}
