export type ChildConsentRequestDto = {
  optionalAgreed: boolean
  sellerProvisionAgreed: boolean
  heightCm: number | null
  weightKg: number | null
  bodyType: string | null
  preferredFit: string | null
}
