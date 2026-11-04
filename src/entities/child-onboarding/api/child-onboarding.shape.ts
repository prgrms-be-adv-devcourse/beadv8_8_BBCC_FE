import { bool, obj, oneOf } from '@/shared/api'
export const childOnboardingShape = obj({
  ageGroup: oneOf(['UNDER_14', 'OVER_14']),
  noticeConfirmed: bool,
  consented: bool,
  hasProfile: bool,
})
