import { useMutation, useQueryClient } from '@tanstack/react-query'
import { sellerApi, sellerKeys } from '@/entities/seller'
import { runWithAction } from '@/shared/api'

export function useApproveSeller() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (applicationId: string) =>
      runWithAction('판매자 승인', () => sellerApi.approve(applicationId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sellerKeys.all }),
  })
}
