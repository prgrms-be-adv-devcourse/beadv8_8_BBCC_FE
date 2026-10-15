import { canDecrease, canIncrease, type CartLine } from '@/entities/cart'
import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useEditCartItem } from '../model/use-edit-cart-item'

type CartItemControlsProps = { line: CartLine }

export function CartItemControls({ line }: CartItemControlsProps) {
  const { changeQuantity, remove, pending, error } = useEditCartItem(line.id)

  return (
    <div className="flex items-center gap-1">
      <Button
        size="icon-sm"
        variant="outline"
        disabled={pending || !canDecrease(line)}
        onClick={() => changeQuantity(line.quantity - 1)}
      >
        −
      </Button>
      <span className="w-6 text-center text-sm">{line.quantity}</span>
      <Button
        size="icon-sm"
        variant="outline"
        disabled={pending || !canIncrease(line)}
        onClick={() => changeQuantity(line.quantity + 1)}
      >
        +
      </Button>
      <Button size="sm" variant="ghost" disabled={pending} onClick={remove}>
        빼기
      </Button>
      {error && <StateMessage tone="error">{getErrorMessage(error)}</StateMessage>}
    </div>
  )
}
