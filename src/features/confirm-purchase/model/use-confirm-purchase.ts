import { useMutation, useQueryClient } from '@tanstack/react-query'
import { orderApi, orderKeys } from '@/entities/order'
import { reviewKeys } from '@/entities/review'
import { toast } from '@/shared/lib'
import { runWithAction } from '@/shared/api'

export function useConfirmPurchase(orderId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderItemId: string) =>
      runWithAction('구매확정', () => orderApi.confirmItem(orderId, orderItemId)),
    onSuccess: () => {
      toast('구매확정했어요')
      // 구매확정하면 커뮤니티가 리뷰 작성 자격을 만든다 → 작성 가능 목록도 다시 부른다
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) }),
        queryClient.invalidateQueries({ queryKey: reviewKeys.reviewable }),
      ])
    },
  })
}
