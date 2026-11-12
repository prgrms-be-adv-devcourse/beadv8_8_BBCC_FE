import { apiClient } from '@/shared/api'

export const toggleFavoriteApi = {
  /** 204. 이미 찜했어도 204. 409 판매 종료 · 404 없는 상품 */
  add: (productId: string) => apiClient.put(`/favorites/${productId}`).then(() => undefined),
  /** 204. 찜이 없어도 204 */
  remove: (productId: string) => apiClient.delete(`/favorites/${productId}`).then(() => undefined),
}
