import { useMutation, useQueryClient } from '@tanstack/react-query'
import { childOnboardingKeys } from '@/entities/child-onboarding'
import { runWithAction } from '@/shared/api'
import { completeChildOnboardingApi } from '../api/complete-child-onboarding-api'
export function useCompleteChildOnboarding() {
  const client = useQueryClient()
  const notice = useMutation({
    mutationFn: () => runWithAction('자녀 안내 확인', completeChildOnboardingApi.notice),
    onSuccess: () => client.invalidateQueries({ queryKey: childOnboardingKeys.all }),
  })
  return { notice }
}
