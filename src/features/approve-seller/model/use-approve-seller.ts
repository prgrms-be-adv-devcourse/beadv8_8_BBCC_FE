import { useMutation, useQueryClient } from '@tanstack/react-query'
import { sellerApi, sellerKeys } from '@/entities/seller'
import { toast } from '@/shared/lib'
import { runWithAction } from '@/shared/api'

export function useApproveSeller() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (applicationId: string) =>
      runWithAction('판매자 승인', () => sellerApi.approve(applicationId)),
    onSuccess: () => {
      toast('판매자로 승인했어요')
      return queryClient.invalidateQueries({ queryKey: sellerKeys.all })
    },
  })
}
