import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { clampQuantity, MAX_QUANTITY, MIN_QUANTITY, useChildCartQuery } from '@/entities/cart'
import { AddToCartButton } from '@/features/add-to-cart'
import { ChildWishAddButton } from '@/features/child-wish-cart'
import { SendWishNow } from '@/features/send-wish-now'
import { paths } from '@/shared/config'
import { formatWon } from '@/shared/lib'
import { Input } from '@/shared/ui/input'
import { StateMessage } from '@/shared/ui/StateMessage'

type QuickAddActionsProps = {
  /** 조합이 정해진 옵션. 아직이면 null */
  option: { id: string; price: number } | null
  /** 아직 고르지 않은 항목 안내 */
  missingPick: string | null
  quantity: number
  onQuantityChange: (quantity: number) => void
  /** 입을 자녀 (보호자 장바구니에 같이 실린다) */
  childId: string | null
  isSelling: boolean
  /** 누가 보고 있는지: 자녀 화면 · 로그인한 보호자 · 로그인 전 */
  viewer: 'child' | 'member' | 'guest'
  /** 로그인 전: 고른 옵션 · 수량을 실은 로그인 주소 */
  loginHref: string
  onClose: () => void
}

/** 담기 팝업 아래 고정 줄: 수량 · 금액 · 담기 (자녀 화면은 내 장바구니 담기 · 바로 조르기, 로그인 전은 로그인하고 담기) */
export function QuickAddActions({
  option,
  missingPick,
  quantity,
  onQuantityChange,
  childId,
  isSelling,
  viewer,
  loginHref,
  onClose,
}: QuickAddActionsProps) {
  const navigate = useNavigate()
  // 자녀 「바로 조르기」: 같은 옵션이 장바구니에 있으면 합쳐진다고 알리려고 자녀 장바구니를 읽는다
  const childCart = useChildCartQuery({ enabled: viewer === 'child' })
  const [showsPickHint, setShowsPickHint] = useState(false)
  const optionId = option?.id ?? null
  return (
    <div className="border-ink bg-paper sticky bottom-0 mt-auto space-y-3 border-t-[1.5px] p-4 md:px-6">
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-3 text-[13px] font-bold">
          수량
          <Input
            type="number"
            min={MIN_QUANTITY}
            max={MAX_QUANTITY}
            className="h-11 w-20 text-base"
            value={quantity}
            onChange={(event) => onQuantityChange(clampQuantity(Number(event.target.value)))}
          />
        </label>
        <span
          className={
            option
              ? 'figure ml-auto text-right text-xl font-bold'
              : 'text-ink-2 ml-auto text-right text-sm'
          }
        >
          {option ? formatWon(option.price * quantity) : missingPick}
        </span>
      </div>
      {!isSelling && <StateMessage tone="error">판매 중인 상품이 아니에요.</StateMessage>}
      {showsPickHint && missingPick && (
        <p role="alert" className="text-destructive text-sm font-semibold">
          {missingPick}
        </p>
      )}
      {viewer === 'child' && (
        <div className="space-y-3">
          <ChildWishAddButton optionId={optionId} quantity={quantity} disabled={!isSelling} />
          <SendWishNow
            optionId={optionId}
            quantity={quantity}
            existingQuantity={
              childCart.data?.lines.find((line) => line.optionId === optionId)?.quantity ?? null
            }
            disabled={!isSelling || childCart.isPending}
            onSent={() => navigate(paths.child.wishes)}
          />
        </div>
      )}
      {viewer === 'member' && (
        <AddToCartButton
          optionId={optionId}
          childId={childId}
          quantity={quantity}
          disabled={!isSelling}
          cartHref={paths.shop.cart}
          onContinue={onClose}
        />
      )}
      {viewer === 'guest' &&
        (option ? (
          <Link to={loginHref} className="shop-btn w-full">
            로그인하고 담기
          </Link>
        ) : (
          <button type="button" className="shop-btn w-full" onClick={() => setShowsPickHint(true)}>
            로그인하고 담기
          </button>
        ))}
    </div>
  )
}
