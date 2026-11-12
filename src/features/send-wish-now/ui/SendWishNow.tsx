import { useState } from 'react'
import { confirmAction } from '@/shared/lib'
import { Input } from '@/shared/ui/input'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useSendWishNow, wishNowErrorMessage } from '../model/use-send-wish-now'
import { wishNowMergeNotice, wishNowOverLimitNotice } from '../model/wish-now.rules'

const MESSAGE_MAX = 100

type SendWishNowProps = {
  optionId: string | null
  quantity: number
  /** 장바구니에 이미 있는 같은 옵션의 수량 (없으면 null) */
  existingQuantity: number | null
  disabled: boolean
  onSent: (requestId: string) => void
}

/** 자녀 상품 상세의 「바로 조르기」: 한마디(선택) → 확인 → 장바구니에 담고 그 칸으로 조르기를 보낸다 */
export function SendWishNow({
  optionId,
  quantity,
  existingQuantity,
  disabled,
  onSent,
}: SendWishNowProps) {
  const [message, setMessage] = useState('')
  const send = useSendWishNow()
  const overLimit = wishNowOverLimitNotice(existingQuantity, quantity)

  async function handleSend() {
    if (!optionId || overLimit) return
    const merge = wishNowMergeNotice(existingQuantity, quantity)
    const confirmed = await confirmAction({
      title: '보호자에게 바로 조를까요?',
      description: merge ?? '장바구니에 담고 보호자에게 조르기를 보내요.',
      confirmLabel: '조르기 보내기',
    })
    if (confirmed) send.mutate({ optionId, quantity, message }, { onSuccess: onSent })
  }

  return (
    <div className="border-rule space-y-2 rounded-lg border p-3">
      <label htmlFor="wish-now-message" className="text-sm font-semibold">
        보호자에게 한마디 (선택)
      </label>
      <Input
        id="wish-now-message"
        value={message}
        maxLength={MESSAGE_MAX}
        placeholder="예: 이거 입고 싶어요"
        onChange={(event) => setMessage(event.target.value)}
      />
      <button
        type="button"
        className="shop-btn w-full"
        disabled={disabled || !optionId || overLimit !== null || send.isPending}
        aria-busy={send.isPending}
        onClick={handleSend}
      >
        바로 조르기
      </button>
      {overLimit && <StateMessage tone="error">{overLimit}</StateMessage>}
      {send.isError && <StateMessage tone="error">{wishNowErrorMessage(send.error)}</StateMessage>}
    </div>
  )
}
