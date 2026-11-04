import { useMutation, useQueryClient } from '@tanstack/react-query'
import { childKeys } from '@/entities/child'
import { childOnboardingKeys } from '@/entities/child-onboarding'
import { runWithAction } from '@/shared/api'
import { completeChildOnboardingApi } from '../api/complete-child-onboarding-api'
import { toChildConsentRequest, type ChildConsent } from './child-consent.mapper'
export function useCompleteChildOnboarding() {
  const client = useQueryClient()
  const onSuccess = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: childOnboardingKeys.all }),
      client.invalidateQueries({ queryKey: childKeys.own }),
    ])
  }
  const notice = useMutation({
    mutationFn: () => runWithAction('자녀 안내 확인', completeChildOnboardingApi.notice),
    onSuccess,
  })
  const consent = useMutation({
    mutationFn: (value: ChildConsent) =>
      runWithAction('자녀 동의', () =>
        completeChildOnboardingApi.consent(toChildConsentRequest(value)),
      ),
    onSuccess,
  })
  return { notice, consent }
}
