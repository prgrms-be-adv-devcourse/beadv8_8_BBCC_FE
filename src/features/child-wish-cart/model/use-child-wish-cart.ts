import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cartKeys } from '@/entities/cart'
import { runWithAction } from '@/shared/api'
import { childWishCartApi } from '../api/child-wish-cart-api'

export function useChildWishCart() {
  const queryClient = useQueryClient()
  const refresh = () => queryClient.invalidateQueries({ queryKey: cartKeys.child })
  const add = useMutation({
    mutationFn: ({ optionId, quantity }: { optionId: string; quantity: number }) =>
      runWithAction('내 장바구니에 담기', () => childWishCartApi.add(optionId, quantity)),
    onSuccess: refresh,
  })
  const remove = useMutation({
    mutationFn: (cartItemId: string) =>
      runWithAction('장바구니에서 빼기', () => childWishCartApi.remove(cartItemId)),
    onSuccess: refresh,
    // 예약된 칸(409)이면 장바구니를 다시 불러 잠김을 보여 준다
    onError: refresh,
  })
  return { add, remove }
}
