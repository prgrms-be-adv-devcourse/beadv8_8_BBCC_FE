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

/** 일괄 처리: 고른 주문을 주문마다 발송 · 배송 완료 요청 (일괄 API가 없어 단건을 여러 번) */
export function useBulkShipping() {
  const queryClient = useQueryClient()
  const refresh = () => queryClient.invalidateQueries({ queryKey: sellerOrderKeys.list })
  const shipMany = useMutation({
    mutationFn: (inputs: { sellerOrderId: string; carrier: string; trackingNumber: string }[]) =>
      runWithAction(`일괄 발송 ${inputs.length}건`, () =>
        Promise.all(
          inputs.map((input) =>
            sellerOrderApi.ship(input.sellerOrderId, {
              carrier: input.carrier,
              trackingNumber: input.trackingNumber.trim(),
            }),
          ),
        ),
      ),
    onSuccess: (_, inputs) => {
      toast(`${inputs.length}건을 발송 처리했어요`)
      return refresh()
    },
    onError: () => refresh(),
  })
  const deliverMany = useMutation({
    mutationFn: (sellerOrderIds: string[]) =>
      runWithAction(`일괄 배송 완료 ${sellerOrderIds.length}건`, () =>
        Promise.all(sellerOrderIds.map((id) => sellerOrderApi.deliver(id))),
      ),
    onSuccess: (_, ids) => {
      toast(`${ids.length}건을 배송 완료로 바꿨어요`)
      return refresh()
    },
    onError: () => refresh(),
  })
  return { shipMany, deliverMany }
}
