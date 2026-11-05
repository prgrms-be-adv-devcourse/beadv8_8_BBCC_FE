import { useQuery } from '@tanstack/react-query'
import { guardianVerificationApi } from '../api/guardian-verification-api'
import { toGuardianVerification } from './guardian-verification.mapper'

export const guardianVerificationKeys = { all: ['guardian-verification'] as const }

export function useGuardianVerificationQuery() {
  return useQuery({
    queryKey: guardianVerificationKeys.all,
    queryFn: guardianVerificationApi.get,
    select: toGuardianVerification,
  })
}
