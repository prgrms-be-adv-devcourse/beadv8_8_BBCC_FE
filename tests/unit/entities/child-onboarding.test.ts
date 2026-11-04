import { describe, expect, it } from 'vitest'
import { onboardingStepOf } from '@/entities/child-onboarding'

describe('첫 로그인 단계', () => {
  it('14세 미만은 안내 확인이 필요하다', () => {
    expect(
      onboardingStepOf({
        ageGroup: 'UNDER_14',
        noticeConfirmed: false,
        consented: false,
        hasProfile: true,
      }),
    ).toBe('NOTICE')
    expect(
      onboardingStepOf({
        ageGroup: 'UNDER_14',
        noticeConfirmed: true,
        consented: false,
        hasProfile: true,
      }),
    ).toBe('DONE')
  })
  it('14세 이상은 본인 동의가 필요하다', () => {
    expect(
      onboardingStepOf({
        ageGroup: 'OVER_14',
        noticeConfirmed: false,
        consented: false,
        hasProfile: false,
      }),
    ).toBe('CONSENT')
    expect(
      onboardingStepOf({
        ageGroup: 'OVER_14',
        noticeConfirmed: true,
        consented: false,
        hasProfile: true,
      }),
    ).toBe('CONSENT')
    expect(
      onboardingStepOf({
        ageGroup: 'OVER_14',
        noticeConfirmed: false,
        consented: true,
        hasProfile: true,
      }),
    ).toBe('DONE')
  })
})
