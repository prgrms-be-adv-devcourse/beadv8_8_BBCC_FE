import { useMutation, useQueryClient } from '@tanstack/react-query'
import { orderApi, orderKeys } from '@/entities/order'
import { toast } from '@/shared/lib'
import { runWithAction } from '@/shared/api'

export function useConfirmPurchase(orderId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderItemId: string) =>
      runWithAction('구매확정', () => orderApi.confirmItem(orderId, orderItemId)),
    onSuccess: () => {
      toast('구매확정했어요')
      return queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) })
    },
  })
}
