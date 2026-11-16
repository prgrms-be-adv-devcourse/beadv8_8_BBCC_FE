import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import type { CartLine } from '@/entities/cart'
import { ProductImage } from '@/entities/product'
import { canSendWishLine } from '@/entities/wish'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { formatWon, optionLabel } from '@/shared/lib'
import { Textarea } from '@/shared/ui/input'
import { StateMessage } from '@/shared/ui/StateMessage'
import { wishSelectionTotal } from '../model/child-wish.rules'
import { useChildWishSelection } from '../model/use-child-wish-selection'
import { useSendChildWish } from '../model/use-send-child-wish'

const MESSAGE_MAX = 100

type SendChildWishProps = {
  items: CartLine[]
  /** 줄 → 사진 (모르면 기본 이미지) */
  imageOf: (item: CartLine) => string | null
  renderRemove: (item: CartLine) => ReactNode
}

/** 자녀 장바구니에서 조르기 보내기: 보낼 수 있는 줄은 처음부터 모두 고른 상태 → 합계 → 메시지 → 보내기 */
export function SendChildWish({ items, imageOf, renderRemove }: SendChildWishProps) {
  const selection = useChildWishSelection(items)
  const [message, setMessage] = useState('')
  const send = useSendChildWish()
  const total = wishSelectionTotal(items, selection.ids)

  const handleSend = () =>
    send.mutate(
      { ids: selection.ids, message },
      {
        onSuccess: () => {
          selection.clear()
          setMessage('')
        },
      },
    )

  return (
    <div className="space-y-4">
      {selection.sendableCount > 0 && (
        <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            className="accent-signal size-5"
            checked={selection.isAllSelected}
            onChange={selection.toggleAll}
          />
          모두 고르기 ({selection.ids.length}/{selection.sendableCount})
        </label>
      )}
      <ul className="divide-rule border-rule divide-y border-y">
        {items.map((item) => {
          const option = optionLabel(item)
          return (
            <li key={item.id} className="flex items-start gap-3 py-4">
              <input
                type="checkbox"
                className="accent-signal mt-1 size-5 shrink-0"
                aria-label={`${item.productName} 조르기에 넣기`}
                checked={selection.isSelected(item.id)}
                disabled={!canSendWishLine(item)}
                onChange={() => selection.toggle(item.id)}
              />
              <ProductImage
                src={imageOf(item)}
                alt={item.productName}
                className="rounded-card aspect-square w-18 shrink-0 object-cover"
              />
              <div className="min-w-0 flex-1 space-y-0.5">
                {item.sellerName && <p className="text-ink-3 text-xs">{item.sellerName}</p>}
                <p className="text-[15px] font-semibold">{item.productName}</p>
                <p className="text-ink-2 text-[13px]">
                  {[option, `${item.quantity}개`].filter(Boolean).join(' · ')}
                </p>
                <p className="figure text-[15px] font-bold">{formatWon(item.lineAmount)}</p>
                {!item.purchasable && (
                  <p className="text-destructive text-xs font-semibold">지금은 살 수 없어요</p>
                )}
                {item.reserved && (
                  <p className="text-signal text-xs font-semibold">
                    진행 중인 조르기에 담겨 있어요
                  </p>
                )}
                <div className="pt-1">{renderRemove(item)}</div>
              </div>
            </li>
          )
        })}
      </ul>
      <p className="flex justify-between text-[15px]">
        <span>고른 상품 {selection.ids.length}개</span>
        <strong className="figure">{formatWon(total)}</strong>
      </p>
      <div className="space-y-1.5">
        <label htmlFor="wish-message" className="text-sm font-semibold">
          보호자에게 한마디 (선택)
        </label>
        <Textarea
          id="wish-message"
          rows={2}
          value={message}
          maxLength={MESSAGE_MAX}
          placeholder="예: 겨울에 쓰고 싶어요"
          onChange={(event) => setMessage(event.target.value)}
        />
        <p className="text-ink-3 figure text-right text-xs">
          {message.length}/{MESSAGE_MAX}
        </p>
      </div>
      <button
        type="button"
        className="shop-btn w-full"
        disabled={!selection.ids.length || send.isPending}
        aria-busy={send.isPending}
        onClick={handleSend}
      >
        {selection.ids.length
          ? `${selection.ids.length}개 조르기 보내기`
          : '조를 상품을 골라 주세요'}
      </button>
      <p className="text-ink-3 text-xs">보호자가 7일 안에 답하지 않으면 조르기가 끝나요.</p>
      {send.isError && <StateMessage tone="error">{getErrorMessage(send.error)}</StateMessage>}
      {send.isSuccess && (
        <p role="status" className="text-sm">
          보냈어요.{' '}
          <Link to={paths.child.wishes} className="shop-link">
            내 조르기 보기
          </Link>
        </p>
      )}
    </div>
  )
}
