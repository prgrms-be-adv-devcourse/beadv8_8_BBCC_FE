import { canWithdrawWish, type WishRequest } from '@/entities/wish'
import { getErrorMessage } from '@/shared/api'
import { confirmAction } from '@/shared/lib'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useWithdrawChildWish } from '../model/use-withdraw-child-wish'

type WithdrawChildWishButtonProps = { wish: WishRequest }

/** 대기 중이고 기한 전인 조르기만 거두기 버튼을 그린다 */
export function WithdrawChildWishButton({ wish }: WithdrawChildWishButtonProps) {
  const { withdraw, pending, error } = useWithdrawChildWish(wish.requestId)
  if (!canWithdrawWish(wish) && !error) return null

  async function handleWithdraw() {
    const ok = await confirmAction({
      title: '조르기를 거둘까?',
      description:
        '보호자에게 보낸 조르기가 취소돼. 옷은 장바구니에 그대로 남아서 다시 조를 수 있어.',
      confirmLabel: '거두기',
    })
    if (ok) withdraw()
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {canWithdrawWish(wish) && (
        <button
          type="button"
          disabled={pending}
          onClick={handleWithdraw}
          className="text-ink min-h-11 text-sm font-bold underline underline-offset-[3px] disabled:opacity-50"
        >
          조르기 거두기
        </button>
      )}
      {error && <StateMessage tone="error">{getErrorMessage(error)}</StateMessage>}
    </div>
  )
}
