import { canBuyerCancel, type Order } from '@/entities/order'
import { getErrorMessage } from '@/shared/api'
import { confirmAction } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useCancelOrder } from '../model/use-cancel-order'

type CancelOrderButtonProps = { order: Order }

/** 결제 처리 중 · 발송 전이면 주문 전체를 취소한다 */
export function CancelOrderButton({ order }: CancelOrderButtonProps) {
  const { cancel, pending, error } = useCancelOrder(order.id)
  const isCancellable = canBuyerCancel(order)
  if (!isCancellable && !error) return null

  async function handleCancel() {
    const ok = await confirmAction({
      title: '주문을 취소할까요?',
      description:
        order.status === 'PAID'
          ? '주문한 상품이 모두 취소되고 결제한 예치금은 돌려드려요. 되돌릴 수 없어요.'
          : '결제 처리를 멈추고 주문을 취소해요. 되돌릴 수 없어요.',
      confirmLabel: '주문 취소',
      tone: 'danger',
    })
    if (ok) cancel()
  }

  return (
    <div className="space-y-2">
      {isCancellable && (
        <Button
          variant="destructive"
          className="h-10 rounded-md px-4"
          disabled={pending}
          onClick={handleCancel}
        >
          주문 취소
        </Button>
      )}
      {error && <StateMessage tone="error">{getErrorMessage(error)}</StateMessage>}
    </div>
  )
}
