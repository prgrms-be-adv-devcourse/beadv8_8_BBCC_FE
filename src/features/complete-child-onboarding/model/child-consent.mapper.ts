import type { ChildConsentRequestDto } from '../api/child-consent.dto'
export type ChildConsent = {
  optionalAgreed: boolean
  sellerProvisionAgreed: boolean
  heightCm: number | null
  weightKg: number | null
  bodyType: string | null
  preferredFit: string | null
}
export function toChildConsentRequest(value: ChildConsent): ChildConsentRequestDto {
  return {
    ...value,
    bodyType: value.optionalAgreed ? value.bodyType : null,
    preferredFit: value.optionalAgreed ? value.preferredFit : null,
  }
}
