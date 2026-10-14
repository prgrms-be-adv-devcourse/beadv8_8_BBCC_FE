import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cartApi, cartKeys } from '@/entities/cart'
import { runWithAction } from '@/shared/api'

export function useEditCartItem(cartItemId: string) {
  const queryClient = useQueryClient()
  const onSuccess = () => queryClient.invalidateQueries({ queryKey: cartKeys.mine })

  const changeQuantity = useMutation({
    mutationFn: (quantity: number) =>
      runWithAction('장바구니 수량 변경', () => cartApi.changeQuantity(cartItemId, quantity)),
    onSuccess,
  })
  const remove = useMutation({
    mutationFn: () => runWithAction('장바구니에서 빼기', () => cartApi.removeItem(cartItemId)),
    onSuccess,
  })

  return {
    changeQuantity: changeQuantity.mutate,
    remove: () => remove.mutate(),
    pending: changeQuantity.isPending || remove.isPending,
    error: changeQuantity.error ?? remove.error,
  }
}
