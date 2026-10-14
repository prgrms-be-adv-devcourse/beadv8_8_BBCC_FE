import { apiClient } from '@/shared/api'
import type { AddCartItemRequestDto, CartDto } from './cart.dto'

export const cartApi = {
  get: () => apiClient.get<CartDto>('/cart').then((response) => response.data),
  addItem: (request: AddCartItemRequestDto) => apiClient.post('/cart/items', request),
  changeQuantity: (cartItemId: string, quantity: number) =>
    apiClient.patch(`/cart/items/${cartItemId}`, { quantity }),
  removeItem: (cartItemId: string) => apiClient.delete(`/cart/items/${cartItemId}`),
}
