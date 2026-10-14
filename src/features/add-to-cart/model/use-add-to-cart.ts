import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cartApi, cartKeys, toAddCartItemRequest } from '@/entities/cart'
import { runWithAction } from '@/shared/api'

export type AddToCartInput = { optionId: string; childId: string | null; quantity: number }

export function useAddToCart() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: AddToCartInput) =>
      runWithAction('장바구니 담기', () => cartApi.addItem(toAddCartItemRequest(input))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cartKeys.mine }),
  })
}
