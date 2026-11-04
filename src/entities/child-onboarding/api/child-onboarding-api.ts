import { apiClient, expectShape } from '@/shared/api'
import type { ChildOnboardingDto } from './child-onboarding.dto'
import { childOnboardingShape } from './child-onboarding.shape'
export const childOnboardingApi = {
  get: () =>
    apiClient.get<ChildOnboardingDto>('/child/onboarding').then(expectShape(childOnboardingShape)),
}
