import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cartApi, cartKeys } from '@/entities/cart'
import { runWithAction } from '@/shared/api'
import { toast } from '@/shared/lib'

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

/** 선택 삭제: 고른 줄을 하나씩 뺀다 (한 번에 빼는 API가 없어 줄마다 요청) */
export function useRemoveCartItems() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (cartItemIds: string[]) =>
      runWithAction('장바구니 선택 삭제', () =>
        Promise.all(cartItemIds.map((cartItemId) => cartApi.removeItem(cartItemId))),
      ),
    onSuccess: (_, cartItemIds) => {
      toast(`${cartItemIds.length}개를 장바구니에서 뺐어요`)
      return queryClient.invalidateQueries({ queryKey: cartKeys.mine })
    },
  })
}
