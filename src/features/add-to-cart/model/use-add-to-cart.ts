import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cartApi, cartKeys, toAddCartItemRequest } from '@/entities/cart'
import { runWithAction } from '@/shared/api'

export type AddToCartInput = { optionId: string; childId: string | null; quantity: number }

export function useAddToCart() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: AddToCartInput) =>
      runWithAction('장바구니 담기', () => cartApi.addItem(toAddCartItemRequest(input))),
    // 담은 뒤 안내 · 장바구니 링크는 버튼 아래에 바로 보여 준다 (영역마다 장바구니 주소가 달라서).
    // 장바구니를 다시 불러 머리말 개수 배지에도 반영한다
    onSuccess: () => queryClient.fetchQuery({ queryKey: cartKeys.mine, queryFn: cartApi.get }),
  })
}
