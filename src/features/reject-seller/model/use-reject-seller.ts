import { useMutation, useQueryClient } from '@tanstack/react-query'
import { sellerApi, sellerKeys } from '@/entities/seller'
import { toast } from '@/shared/lib'
import { runWithAction } from '@/shared/api'

export function useRejectSeller() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ applicationId, reason }: { applicationId: string; reason: string }) =>
      runWithAction('판매자 신청 거절', () =>
        sellerApi.reject(applicationId, { reason: reason.trim() }),
      ),
    onSuccess: () => {
      toast('판매자 신청을 거절했어요')
      return queryClient.invalidateQueries({ queryKey: sellerKeys.all })
    },
  })
}
