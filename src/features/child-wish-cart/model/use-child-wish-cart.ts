import { useMutation, useQueryClient } from '@tanstack/react-query'
import { wishKeys } from '@/entities/wish'
import { runWithAction } from '@/shared/api'
import { childWishCartApi } from '../api/child-wish-cart-api'

export function useChildWishCart() {
  const queryClient = useQueryClient()
  const refresh = () => queryClient.invalidateQueries({ queryKey: wishKeys.child })
  const add = useMutation({
    mutationFn: ({ optionId, quantity }: { optionId: string; quantity: number }) =>
      runWithAction('내 장바구니에 담기', () =>
        childWishCartApi.add({ optionId: Number(optionId), quantity }),
      ),
    onSuccess: refresh,
  })
  const remove = useMutation({
    mutationFn: (id: string) =>
      runWithAction('장바구니에서 빼기', () => childWishCartApi.remove(id)),
    onSuccess: refresh,
  })
  return { add, remove }
}
