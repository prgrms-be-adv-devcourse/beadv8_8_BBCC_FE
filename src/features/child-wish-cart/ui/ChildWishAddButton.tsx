import { Link } from 'react-router'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useChildWishCart } from '../model/use-child-wish-cart'

type ChildWishAddButtonProps = { optionId: string | null; quantity: number; disabled: boolean }
export function ChildWishAddButton({ optionId, quantity, disabled }: ChildWishAddButtonProps) {
  const { add } = useChildWishCart()
  return (
    <div>
      <Button
        disabled={disabled || !optionId || add.isPending}
        onClick={() => optionId && add.mutate({ optionId, quantity })}
      >
        내 장바구니에 담기
      </Button>
      {add.isError && <StateMessage tone="error">{getErrorMessage(add.error)}</StateMessage>}
      {add.isSuccess && <Link to={paths.child.cart}>내 장바구니 보기</Link>}
    </div>
  )
}
