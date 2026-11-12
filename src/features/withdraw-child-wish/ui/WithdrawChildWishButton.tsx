import { canWithdrawWish, type WishRequest } from '@/entities/wish'
import { getErrorMessage } from '@/shared/api'
import { confirmAction } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useWithdrawChildWish } from '../model/use-withdraw-child-wish'

type WithdrawChildWishButtonProps = { wish: WishRequest }

/** 대기 중이고 기한 전인 조르기만 철회 버튼을 그린다 */
export function WithdrawChildWishButton({ wish }: WithdrawChildWishButtonProps) {
  const { withdraw, pending, error } = useWithdrawChildWish(wish.requestId)
  if (!canWithdrawWish(wish) && !error) return null

  async function handleWithdraw() {
    const ok = await confirmAction({
      title: '조르기를 철회할까요?',
      description:
        '보호자에게 보낸 조르기가 취소돼요. 상품은 장바구니에 그대로 남아 다시 조를 수 있어요.',
      confirmLabel: '철회하기',
    })
    if (ok) withdraw()
  }

  return (
    <div className="space-y-2">
      {canWithdrawWish(wish) && (
        <Button
          variant="outline"
          className="h-10 rounded-md px-4"
          disabled={pending}
          onClick={handleWithdraw}
        >
          철회
        </Button>
      )}
      {error && <StateMessage tone="error">{getErrorMessage(error)}</StateMessage>}
    </div>
  )
}
