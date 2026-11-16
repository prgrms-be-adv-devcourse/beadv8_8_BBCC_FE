import type { FavoriteOwnerPrincipal } from '@/entities/favorite'
import { apiClient } from '@/shared/api'

export const toggleFavoriteApi = {
  /** 204. 이미 찜했어도 204. 409 판매 종료 · 404 없는 상품 · 403 지워진 자녀 계정 */
  add: (productId: string, principal: FavoriteOwnerPrincipal) =>
    apiClient.put(`/favorites/${productId}`, undefined, { principal }).then(() => undefined),
  /** 204. 찜이 없어도 204 */
  remove: (productId: string, principal: FavoriteOwnerPrincipal) =>
    apiClient.delete(`/favorites/${productId}`, { principal }).then(() => undefined),
}
