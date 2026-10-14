import { useMutation, useQueryClient } from '@tanstack/react-query'
import { sellerOrderApi, sellerOrderKeys } from '@/entities/seller-order'
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
    onSuccess,
  })
  const deliver = useMutation({
    mutationFn: () => runWithAction('배송 완료', () => sellerOrderApi.deliver(sellerOrderId)),
    onSuccess,
  })

  return {
    ship: ship.mutate,
    deliver: () => deliver.mutate(),
    pending: ship.isPending || deliver.isPending,
    error: ship.error ?? deliver.error,
  }
}
