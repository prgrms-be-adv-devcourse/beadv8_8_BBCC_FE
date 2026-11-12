import { apiClient, expectShape } from '@/shared/api'
import type { FavoriteListDto, FavoriteSummaryDto } from './favorite.dto'
import { favoriteListShape, favoriteSummaryShape } from './favorite.shape'

export const favoriteApi = {
  /** 내 찜(최신순 커서). size 1~50 */
  mine: (params: { cursor?: string; size?: number }) =>
    apiClient.get<FavoriteListDto>('/favorites', { params }).then(expectShape(favoriteListShape)),
  /** 주어진 상품(1~50개) 중 내가 찜한 것만. 커서 · size 없음 */
  amongProducts: (productIds: string[]) =>
    apiClient
      .get<FavoriteListDto>('/favorites', { params: { productIds: productIds.join(',') } })
      .then(expectShape(favoriteListShape)),
  /** 상품별 찜 수(공개) */
  summary: (productId: string) =>
    apiClient
      .get<FavoriteSummaryDto>('/favorites/summary', { params: { productId } })
      .then(expectShape(favoriteSummaryShape)),
}
