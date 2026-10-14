import { useMutation, useQueryClient } from '@tanstack/react-query'
import { orderKeys } from '@/entities/order'
import { apiClient, getErrorMessage, runWithAction } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/page-header'

export function ConfirmPurchaseButton({
  orderId,
  orderItemId,
}: {
  orderId: string
  orderItemId: string
}) {
  const queryClient = useQueryClient()

  const confirm = useMutation({
    mutationFn: () =>
      runWithAction('구매확정', () =>
        apiClient.post(`/orders/${orderId}/items/${orderItemId}/confirm`),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) }),
  })

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        disabled={confirm.isPending}
        onClick={() => {
          if (window.confirm('구매확정하면 취소 · 환불할 수 없어요. 확정할까요?')) confirm.mutate()
        }}
      >
        구매확정
      </Button>
      {confirm.isError && (
        <StateMessage tone="error">{getErrorMessage(confirm.error)}</StateMessage>
      )}
    </div>
  )
}
