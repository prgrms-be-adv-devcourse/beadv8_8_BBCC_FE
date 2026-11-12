import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cartKeys } from '@/entities/cart'
import { wishKeys } from '@/entities/wish'
import { runWithAction } from '@/shared/api'
import { toast } from '@/shared/lib'
import { withdrawChildWishApi } from '../api/withdraw-child-wish-api'

/** 자녀 조르기 철회. 성공 · 실패(409 등) 모두 내 조르기 · 장바구니를 다시 받는다 (예약이 풀린 칸) */
export function useWithdrawChildWish(requestId: string) {
  const client = useQueryClient()
  const refresh = () =>
    Promise.all([
      client.invalidateQueries({ queryKey: wishKeys.childRequests }),
      client.invalidateQueries({ queryKey: cartKeys.child }),
    ])
  const withdraw = useMutation({
    mutationFn: () => runWithAction('조르기 철회', () => withdrawChildWishApi.withdraw(requestId)),
    onSuccess: () => {
      toast('조르기를 철회했어요 · 상품은 장바구니에 그대로 있어요')
      return refresh()
    },
    onError: () => refresh(),
  })
  return { withdraw: () => withdraw.mutate(), pending: withdraw.isPending, error: withdraw.error }
}
