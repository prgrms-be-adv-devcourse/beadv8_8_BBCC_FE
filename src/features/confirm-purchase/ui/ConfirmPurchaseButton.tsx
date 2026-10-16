import { confirmAction } from '@/shared/lib'
import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useConfirmPurchase } from '../model/use-confirm-purchase'

type ConfirmPurchaseButtonProps = {
  orderId: string
  orderItemId: string
}

export function ConfirmPurchaseButton({ orderId, orderItemId }: ConfirmPurchaseButtonProps) {
  const confirm = useConfirmPurchase(orderId)

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        disabled={confirm.isPending}
        onClick={async () => {
          if (
            await confirmAction({
              title: '구매확정할까요?',
              description: '구매확정하면 취소 · 환불할 수 없어요.',
              confirmLabel: '구매확정',
            })
          )
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
