import type { GuardianVerificationDto } from '../api/guardian-verification.dto'

export type GuardianVerification = { verified: boolean; verifiedAt: string | null }

export function toGuardianVerification(dto: GuardianVerificationDto): GuardianVerification {
  return { verified: dto.verified, verifiedAt: dto.verifiedAt }
}
