import { useMutation, useQueryClient } from '@tanstack/react-query'
import { guardianVerificationApi, guardianVerificationKeys } from '@/entities/guardian-verification'
import { runWithAction } from '@/shared/api'
import { env } from '@/shared/config'
import { verifyIdentity } from '../lib/portone'

export function useVerifyGuardian() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const identityVerificationId = await verifyIdentity(env.portoneStoreId, env.portoneChannelKey)
      return runWithAction('부모 본인인증', () =>
        guardianVerificationApi.verify(identityVerificationId),
      )
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: guardianVerificationKeys.all }),
  })
}
