import { useQuery } from '@tanstack/react-query'
import { childOnboardingApi } from '../api/child-onboarding-api'
import type { ChildOnboarding } from './child-onboarding'
export const childOnboardingKeys = { all: ['child', 'onboarding'] as const }
export function useChildOnboardingQuery() {
  return useQuery({
    queryKey: childOnboardingKeys.all,
    queryFn: childOnboardingApi.get,
    select: (dto): ChildOnboarding => ({ ...dto }),
    retry: false,
    staleTime: 0,
    gcTime: 0,
  })
}
