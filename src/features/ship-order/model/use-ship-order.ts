import { useMutation, useQueryClient } from '@tanstack/react-query'
import { sellerOrderApi, sellerOrderKeys } from '@/entities/seller-order'
import { toast } from '@/shared/lib'
import { runWithAction } from '@/shared/api'

export function useShipOrder(sellerOrderId: string) {
  const queryClient = useQueryClient()
  const onSuccess = () => queryClient.invalidateQueries({ queryKey: sellerOrderKeys.list })

  const ship = useMutation({
    mutationFn: (input: { carrier: string; trackingNumber: string }) =>
      runWithAction('발송 (송장 등록)', () =>
        sellerOrderApi.ship(sellerOrderId, {
          carrier: input.carrier,
          trackingNumber: input.trackingNumber.trim(),
        }),
      ),
    onSuccess: () => {
      toast('발송 처리했어요 · 구매자에게 배송 중으로 보여요')
      return onSuccess()
    },
  })
  const deliver = useMutation({
    mutationFn: () => runWithAction('배송 완료', () => sellerOrderApi.deliver(sellerOrderId)),
    onSuccess: () => {
      toast('배송 완료로 바꿨어요')
      return onSuccess()
    },
  })

  return {
    ship: ship.mutate,
    deliver: () => deliver.mutate(),
    pending: ship.isPending || deliver.isPending,
    error: ship.error ?? deliver.error,
  }
}
