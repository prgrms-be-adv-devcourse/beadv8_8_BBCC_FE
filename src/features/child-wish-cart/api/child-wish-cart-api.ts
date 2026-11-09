import { childCartApi } from '@/entities/cart'

/** 자녀 장바구니 = 같은 `/api/v1/cart` (BE #998, 자녀 토큰). 입을 아이는 서버가 자기로 고정한다 */
export const childWishCartApi = {
  add: (optionId: string, quantity: number) =>
    childCartApi.addItem({ optionId: Number(optionId), childId: null, quantity }),
  remove: (cartItemId: string) => childCartApi.removeItem(cartItemId),
}
