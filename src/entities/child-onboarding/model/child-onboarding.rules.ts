import type { ChildOnboarding } from './child-onboarding'
export function onboardingStepOf(status: ChildOnboarding): 'NOTICE' | 'CONSENT' | 'DONE' {
  if (status.ageGroup === 'UNDER_14') return status.noticeConfirmed ? 'DONE' : 'NOTICE'
  return status.consented ? 'DONE' : 'CONSENT'
}
