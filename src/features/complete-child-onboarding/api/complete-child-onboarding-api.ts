import { apiClient } from '@/shared/api'
export const completeChildOnboardingApi = {
  notice: () => apiClient.post('/child/onboarding/notice'),
}
