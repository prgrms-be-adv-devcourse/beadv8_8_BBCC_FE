import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import type { CartLine } from '@/entities/cart'
import { ProductImage } from '@/entities/product'
import { canSendWishLine } from '@/entities/wish'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { cn, formatWon, optionLabel } from '@/shared/lib'
import { StateMessage } from '@/shared/ui/StateMessage'
import { wishSelectionTotal } from '../model/child-wish.rules'
import { useChildWishSelection } from '../model/use-child-wish-selection'
import { useSendChildWish } from '../model/use-send-child-wish'

const MESSAGE_MAX = 100

type SendChildWishProps = {
  /** 화면 제목 (오른쪽에 「모두 고르기」가 붙는다) */
  heading: ReactNode
  items: CartLine[]
  /** 줄 → 사진 (모르면 기본 이미지) */
  imageOf: (item: CartLine) => string | null
  /** 뺄 수 있는 줄의 빼기 버튼 (조르는 중인 줄에는 도장을 찍는다) */
  renderRemove: (item: CartLine) => ReactNode
}

/**
 * 자녀 장바구니에서 조르기 보내기: 보낼 수 있는 줄은 처음부터 모두 고른 상태 → 쪽지(합계 · 한마디) → 보내기.
 * 넓은 화면은 오른쪽 쪽지, 휴대폰은 아래 탭 위에 붙은 막대
 */
export function SendChildWish({ heading, items, imageOf, renderRemove }: SendChildWishProps) {
  const selection = useChildWishSelection(items)
  const [message, setMessage] = useState('')
  const [isMemoOpen, setIsMemoOpen] = useState(false)
  const send = useSendChildWish()
  const total = wishSelectionTotal(items, selection.ids)
  const count = selection.ids.length

  const handleSend = () =>
    send.mutate(
      { ids: selection.ids, message },
      {
        onSuccess: () => {
          selection.clear()
          setMessage('')
          setIsMemoOpen(false)
        },
      },
    )

  return (
    <div className="flex flex-col gap-6 md:gap-9">
      <div className="border-ink flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b-[3px] pb-4 md:pb-5">
        {heading}
        {selection.sendableCount > 0 && (
          <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-[15px] font-bold">
            <input
              type="checkbox"
              className="accent-ink size-6 shrink-0 md:size-[26px]"
              checked={selection.isAllSelected}
              onChange={selection.toggleAll}
            />
            조를 수 있는 옷 모두 고르기
          </label>
        )}
      </div>

      <div className="flex flex-wrap items-start gap-10">
        <ul className="min-w-0 flex-[999_1_560px] max-md:pb-40">
          {items.map((item) => {
            const option = optionLabel(item)
            return (
              <li
                key={item.id}
                className={cn(
                  'border-rule flex items-start gap-3 border-b-[1.5px] py-4 md:gap-5 md:py-6',
                  item.reserved && 'opacity-[0.72]',
                )}
              >
                <input
                  type="checkbox"
                  className="accent-ink mt-1 size-6 shrink-0 md:size-[26px]"
                  aria-label={`${item.productName}${option ? ` ${option}` : ''} 조르기에 넣기`}
                  checked={selection.isSelected(item.id)}
                  disabled={!canSendWishLine(item)}
                  onChange={() => selection.toggle(item.id)}
                />
                <ProductImage
                  src={imageOf(item)}
                  alt={item.productName}
                  className="bg-paper-2 h-24 w-[76px] shrink-0 object-cover md:h-40 md:w-32"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-1 md:gap-2">
                  {item.sellerName && <p className="text-[13px]">{item.sellerName}</p>}
                  <p className="text-[15px] font-bold md:text-[19px]">{item.productName}</p>
                  <ul className="flex flex-wrap gap-1.5 text-xs md:text-[13px]">
                    {option && <li className="border-ink border-[1.5px] px-2 py-0.5">{option}</li>}
                    <li className="border-ink figure border-[1.5px] px-2 py-0.5">
                      {item.quantity}개
                    </li>
                  </ul>
                  <p className="font-display text-[19px] md:mt-1 md:text-2xl">
                    {formatWon(item.lineAmount)}
                  </p>
                  {item.reserved && (
                    <p className="font-hand text-base md:text-lg">
                      보호자가 보고 있어서 지금은 뺄 수 없어
                    </p>
                  )}
                  {!item.purchasable && (
                    <p className="text-destructive text-[13px] font-bold">지금은 살 수 없어요</p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  {item.reserved ? (
                    <span className="bg-sheet border-ink font-display rotate-[4deg] border-2 px-2 py-0.5 text-sm whitespace-nowrap md:border-[2.5px] md:px-3 md:py-1 md:text-[17px]">
                      조르는 중
                    </span>
                  ) : (
                    renderRemove(item)
                  )}
                </div>
              </li>
            )
          })}
        </ul>

        <aside
          aria-label="보호자에게 보내는 쪽지"
          className={cn(
            'bg-paper border-ink flex flex-col border-2',
            'max-md:fixed max-md:inset-x-0 max-md:bottom-16 max-md:z-20 max-md:border-x-0 max-md:border-b-0',
            'md:sticky md:top-24 md:max-w-[460px] md:flex-[1_1_380px] md:shadow-[8px_8px_0_var(--shop-ink)]',
          )}
        >
          <div className="bg-sheet border-ink hidden items-center justify-between border-b-2 px-6 py-4 md:flex">
            <span className="font-hand text-[26px] font-bold">To. 보호자님</span>
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path d="M3 6h18v12H3z" />
              <path d="M3 6l9 7 9-7" />
            </svg>
          </div>
          {send.isSuccess ? (
            <div
              role="status"
              className="flex flex-col items-start gap-2 px-4 py-4 md:gap-4 md:px-6 md:py-9"
            >
              <span className="bg-marker font-display px-2.5 text-[28px] md:text-[40px]">
                보냈어!
              </span>
              <p className="text-[15px] leading-relaxed md:text-base">
                보호자에게 알림이 갔어. 답이 오면 조르기에서 볼 수 있어.
              </p>
              <div className="flex flex-wrap items-center gap-x-5">
                <Link
                  to={paths.child.wishes}
                  className="text-ink flex min-h-11 items-center font-bold underline underline-offset-4"
                >
                  내 조르기 보러 가기 <span aria-hidden>&nbsp;→</span>
                </Link>
                {selection.sendableCount > 0 && (
                  <button
                    type="button"
                    onClick={() => send.reset()}
                    className="text-ink min-h-11 text-sm font-bold underline underline-offset-[3px]"
                  >
                    다른 옷도 조르기
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5 px-4 py-3 md:gap-5 md:p-6">
              <p className="flex items-baseline justify-between">
                <span className="text-sm font-bold md:text-base">고른 옷 {count}벌</span>
                <span className="font-display text-2xl md:text-4xl">{formatWon(total)}</span>
              </p>
              <div
                id="wish-message-box"
                className={cn('flex flex-col gap-1.5', !isMemoOpen && 'max-md:hidden')}
              >
                <label htmlFor="wish-message" className="text-sm font-bold">
                  보호자에게 한마디 (안 써도 돼)
                </label>
                <textarea
                  id="wish-message"
                  rows={3}
                  value={message}
                  maxLength={MESSAGE_MAX}
                  placeholder="겨울에 입고 싶어요!"
                  onChange={(event) => setMessage(event.target.value)}
                  className="font-hand text-ink w-full resize-none bg-[repeating-linear-gradient(transparent_0_35px,var(--shop-kraft)_35px_36px)] px-1 text-[22px] leading-9"
                />
                <p className="figure self-end text-xs">
                  {message.length}/{MESSAGE_MAX}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  aria-label="쪽지 쓰기"
                  aria-expanded={isMemoOpen}
                  aria-controls="wish-message-box"
                  onClick={() => setIsMemoOpen((open) => !open)}
                  className="bg-sheet border-ink flex size-[52px] shrink-0 items-center justify-center border-2 md:hidden"
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden
                  >
                    <path d="M4 20h4L19 9l-4-4L4 16z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="shop-btn min-h-[52px] flex-1 text-base md:min-h-14 md:text-[17px]"
                  disabled={!count || send.isPending}
                  aria-busy={send.isPending}
                  onClick={handleSend}
                >
                  {count ? (
                    <>
                      {count}벌 조르기 보내기 <span aria-hidden>→</span>
                    </>
                  ) : (
                    '조를 옷을 골라 줘'
                  )}
                </button>
              </div>
              <p className="hidden text-[13px] leading-relaxed md:block">
                보호자가 7일 안에 답하지 않으면 조르기가 끝나요.
              </p>
              {send.isError && (
                <StateMessage tone="error">{getErrorMessage(send.error)}</StateMessage>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
