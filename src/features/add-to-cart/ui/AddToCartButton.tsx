import { Link } from 'react-router'
import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/page-header'
import { useAddToCart } from '../model/use-add-to-cart'

type Props = {
  optionId: string | null
  /** 입을 자녀 (선택). 상세에서 고른 자녀를 그대로 넘긴다 */
  childId: string | null
  quantity: number
  disabled?: boolean
  /** 담은 뒤 보여 줄 장바구니 주소 (영역마다 다르다) */
  cartHref: string
}

export function AddToCartButton({ optionId, childId, quantity, disabled, cartHref }: Props) {
  const add = useAddToCart()

  return (
    <div className="space-y-2">
      <Button
        size="lg"
        className="w-full"
        disabled={disabled || !optionId || add.isPending}
        onClick={() => optionId && add.mutate({ optionId, childId, quantity })}
      >
        장바구니 담기
      </Button>
      {add.isError && <StateMessage tone="error">{getErrorMessage(add.error)}</StateMessage>}
      {add.isSuccess && (
        <StateMessage>
          담았어요.{' '}
          <Link to={cartHref} className="text-primary underline">
            장바구니 보기
          </Link>
        </StateMessage>
      )}
    </div>
  )
}
