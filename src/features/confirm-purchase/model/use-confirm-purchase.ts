import { useMutation, useQueryClient } from '@tanstack/react-query'
import { orderApi, orderKeys } from '@/entities/order'
import { runWithAction } from '@/shared/api'

export function useConfirmPurchase(orderId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderItemId: string) =>
      runWithAction('구매확정', () => orderApi.confirmItem(orderId, orderItemId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) }),
  })
}
