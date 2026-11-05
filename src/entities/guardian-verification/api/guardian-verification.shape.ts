import { bool, nullable, obj, str } from '@/shared/api'

export const guardianVerificationShape = obj({ verified: bool, verifiedAt: nullable(str) })
