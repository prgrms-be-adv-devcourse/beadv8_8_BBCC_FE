import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/page-header'
import { useConfirmPurchase } from '../model/use-confirm-purchase'

export function ConfirmPurchaseButton({
  orderId,
  orderItemId,
}: {
  orderId: string
  orderItemId: string
}) {
  const confirm = useConfirmPurchase(orderId)

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        disabled={confirm.isPending}
        onClick={() => {
          if (window.confirm('구매확정하면 취소 · 환불할 수 없어요. 확정할까요?'))
            confirm.mutate(orderItemId)
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
