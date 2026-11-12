import { useMutation, useQueryClient } from '@tanstack/react-query'
import { orderKeys } from '@/entities/order'
import { runWithAction } from '@/shared/api'
import { toast } from '@/shared/lib'
import { cancelOrderApi } from '../api/cancel-order-api'

/** 구매자 주문 취소. 성공 · 실패(409 등) 모두 주문 상세 · 목록을 다시 받아 지금 상태를 보여 준다 */
export function useCancelOrder(orderId: string) {
  const client = useQueryClient()
  const refresh = () =>
    Promise.all([
      client.invalidateQueries({ queryKey: orderKeys.detail(orderId) }),
      client.invalidateQueries({ queryKey: orderKeys.list }),
    ])
  const cancel = useMutation({
    mutationFn: () => runWithAction('주문 취소', () => cancelOrderApi.cancel(orderId)),
    onSuccess: () => {
      toast('주문을 취소했어요')
      return refresh()
    },
    onError: () => refresh(),
  })
  return { cancel: () => cancel.mutate(), pending: cancel.isPending, error: cancel.error }
}
