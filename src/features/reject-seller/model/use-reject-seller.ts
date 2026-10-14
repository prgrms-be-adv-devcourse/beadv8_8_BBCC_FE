import { useMutation, useQueryClient } from '@tanstack/react-query'
import { sellerApi, sellerKeys } from '@/entities/seller'
import { runWithAction } from '@/shared/api'

export function useRejectSeller() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ applicationId, reason }: { applicationId: string; reason: string }) =>
      runWithAction('판매자 신청 거절', () =>
        sellerApi.reject(applicationId, { reason: reason.trim() }),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sellerKeys.all }),
  })
}
