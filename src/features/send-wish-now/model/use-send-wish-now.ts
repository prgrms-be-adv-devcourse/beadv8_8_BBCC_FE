import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cartKeys } from '@/entities/cart'
import { wishKeys } from '@/entities/wish'
import { getErrorMessage, runWithAction } from '@/shared/api'
import { sendWishNowApi } from '../api/send-wish-now-api'
import { wishNowCartOnlyNotice } from './wish-now.rules'

/** ①만 되고 ②가 실패했을 때 (장바구니에는 담겼다) */
export class WishNowCartOnlyError extends Error {}

type WishNowInput = { optionId: string; quantity: number; message: string }

/**
 * 바로 조르기: ① 담기 → ② 조르기 (성공하면 조르기 ID). ①이 실패하면 그 오류 그대로, ②가 실패하면 「장바구니에는 담았어요」 안내.
 * 어느 쪽이든 자녀 장바구니 · 내 조르기를 다시 받는다
 */
export function useSendWishNow() {
  const client = useQueryClient()
  const refresh = () =>
    Promise.all([
      client.invalidateQueries({ queryKey: cartKeys.child }),
      client.invalidateQueries({ queryKey: wishKeys.childRequests }),
    ])
  return useMutation({
    mutationFn: ({ optionId, quantity, message }: WishNowInput) =>
      runWithAction('바로 조르기', async () => {
        const line = await sendWishNowApi.addToCart(optionId, quantity)
        try {
          const wish = await sendWishNowApi.send(line.cartItemId, message.trim() || null)
          return wish.requestId
        } catch (error) {
          throw new WishNowCartOnlyError(wishNowCartOnlyNotice(getErrorMessage(error)))
        }
      }),
    onSettled: refresh,
  })
}

/** 화면에 보일 실패 문구: ②만 실패면 장바구니 안내, 그 밖은 서버 detail */
export function wishNowErrorMessage(error: unknown): string {
  return error instanceof WishNowCartOnlyError ? error.message : getErrorMessage(error)
}
