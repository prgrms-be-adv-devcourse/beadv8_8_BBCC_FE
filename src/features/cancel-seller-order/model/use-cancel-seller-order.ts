import { useMutation, useQueryClient } from '@tanstack/react-query'
import { sellerOrderKeys } from '@/entities/seller-order'
import { runWithAction } from '@/shared/api'
import { toast } from '@/shared/lib'
import { cancelSellerOrderApi } from '../api/cancel-seller-order-api'
import { toCancelSellerOrderRequest, type SellerCancelReason } from './cancel-seller-order'

/** 판매자 발송 전 취소. 성공 · 실패(409 등) 모두 목록을 다시 받아 지금 상태를 보여 준다 */
export function useCancelSellerOrder(sellerOrderId: string) {
  const queryClient = useQueryClient()
  const refresh = () => queryClient.invalidateQueries({ queryKey: sellerOrderKeys.list })
  const cancel = useMutation({
    mutationFn: (input: { reason: SellerCancelReason; memo: string }) =>
      runWithAction('판매자 발송 전 취소', () =>
        cancelSellerOrderApi.cancel(sellerOrderId, toCancelSellerOrderRequest(input)),
      ),
    onSuccess: () => {
      toast('발송 전에 취소했어요 · 구매자에게 환불돼요')
      return refresh()
    },
    onError: () => refresh(),
  })
  return {
    cancel: cancel.mutate,
    pending: cancel.isPending,
    error: cancel.error,
    isDone: cancel.isSuccess,
  }
}
