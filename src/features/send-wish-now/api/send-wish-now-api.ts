import { childCartApi } from '@/entities/cart'
import { wishRequestShape } from '@/entities/wish'
import { apiClient, expectShape } from '@/shared/api'

/** 바로 조르기 = ① 자녀 장바구니에 담기 → ② 그 칸으로 조르기 보내기 (BE 변경 없음, 자녀 토큰) */
export const sendWishNowApi = {
  addToCart: (optionId: string, quantity: number) =>
    childCartApi.addItem({ optionId: Number(optionId), childId: null, quantity }),
  send: (cartItemId: string, message: string | null) =>
    apiClient
      .post(
        '/wish/requests',
        { cartItemIds: [Number(cartItemId)], message },
        { principal: 'child' },
      )
      .then(expectShape(wishRequestShape)),
}
