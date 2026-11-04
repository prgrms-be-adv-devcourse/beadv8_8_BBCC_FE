import { expect, it } from 'vitest'
import { toChildConsentRequest } from '@/features/complete-child-onboarding'

it('선택 동의하지 않으면 체형과 선호 핏을 보내지 않는다', () => {
  expect(
    toChildConsentRequest({
      optionalAgreed: false,
      sellerProvisionAgreed: true,
      heightCm: 150,
      weightKg: 40,
      bodyType: 'SLIM',
      preferredFit: 'LOOSE',
    }),
  ).toEqual({
    optionalAgreed: false,
    sellerProvisionAgreed: true,
    heightCm: 150,
    weightKg: 40,
    bodyType: null,
    preferredFit: null,
  })
})

it('선택 동의하면 프로필 입력값을 보낸다', () => {
  const value = {
    optionalAgreed: true,
    sellerProvisionAgreed: false,
    heightCm: 150,
    weightKg: 40,
    bodyType: 'SLIM',
    preferredFit: 'LOOSE',
  }
  expect(toChildConsentRequest(value)).toEqual(value)
})
