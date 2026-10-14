import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cartKeys, type CartLine } from '@/entities/cart'
import { apiClient, getErrorMessage, runWithAction } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/page-header'

export function CartItemControls({ line }: { line: CartLine }) {
  const queryClient = useQueryClient()
  const onSuccess = () => queryClient.invalidateQueries({ queryKey: cartKeys.mine })

  const changeQuantity = useMutation({
    mutationFn: (quantity: number) =>
      runWithAction('장바구니 수량 변경', () =>
        apiClient.patch(`/cart/items/${line.cartItemId}`, { quantity }),
      ),
    onSuccess,
  })
  const remove = useMutation({
    mutationFn: () =>
      runWithAction('장바구니에서 빼기', () => apiClient.delete(`/cart/items/${line.cartItemId}`)),
    onSuccess,
  })
  const pending = changeQuantity.isPending || remove.isPending
  const error = changeQuantity.error ?? remove.error

  return (
    <div className="flex items-center gap-1">
      <Button
        size="icon-sm"
        variant="outline"
        disabled={pending || line.quantity <= 1}
        onClick={() => changeQuantity.mutate(line.quantity - 1)}
      >
        −
      </Button>
      <span className="w-6 text-center text-sm">{line.quantity}</span>
      <Button
        size="icon-sm"
        variant="outline"
        disabled={pending}
        onClick={() => changeQuantity.mutate(line.quantity + 1)}
      >
        +
      </Button>
      <Button size="sm" variant="ghost" disabled={pending} onClick={() => remove.mutate()}>
        빼기
      </Button>
      {error && <StateMessage tone="error">{getErrorMessage(error)}</StateMessage>}
    </div>
  )
}
