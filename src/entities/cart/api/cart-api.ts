import { apiClient, expectShape } from '@/shared/api'
import type { AddCartItemRequestDto, CartDto } from './cart.dto'
import { cartShape } from './cart.shape'

export const cartApi = {
  get: () => apiClient.get<CartDto>('/cart').then(expectShape(cartShape)),
  addItem: (request: AddCartItemRequestDto) => apiClient.post('/cart/items', request),
  changeQuantity: (cartItemId: string, quantity: number) =>
    apiClient.patch(`/cart/items/${cartItemId}`, { quantity }),
  removeItem: (cartItemId: string) => apiClient.delete(`/cart/items/${cartItemId}`),
}

/** 로그인한 자녀의 장바구니: 같은 /cart를 자녀 토큰으로 (BE #998). 입을 아이는 서버가 자기로 고정한다 */
const asChild = { principal: 'child' } as const
export const childCartApi = {
  get: () => apiClient.get<CartDto>('/cart', asChild).then(expectShape(cartShape)),
  addItem: (request: AddCartItemRequestDto) => apiClient.post('/cart/items', request, asChild),
  removeItem: (cartItemId: string) => apiClient.delete(`/cart/items/${cartItemId}`, asChild),
}
