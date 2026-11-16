import { apiClient, expectShape } from '@/shared/api'
import type { FavoriteListDto, FavoriteSummaryDto } from './favorite.dto'
import { favoriteListShape, favoriteSummaryShape } from './favorite.shape'

/** 찜하는 사람: 보호자 회원 또는 자녀 계정 (같은 /favorites를 각자 토큰으로, BE #1377). 목록 · 하트는 본인 것만 */
export type FavoriteOwnerPrincipal = 'member' | 'child'

export const favoriteApi = {
  /** 내 찜(최신순 커서). size 1~50 */
  mine: (params: { cursor?: string; size?: number }, principal: FavoriteOwnerPrincipal) =>
    apiClient
      .get<FavoriteListDto>('/favorites', { params, principal })
      .then(expectShape(favoriteListShape)),
  /** 주어진 상품(1~50개) 중 내가 찜한 것만. 커서 · size 없음 */
  amongProducts: (productIds: string[], principal: FavoriteOwnerPrincipal) =>
    apiClient
      .get<FavoriteListDto>('/favorites', {
        params: { productIds: productIds.join(',') },
        principal,
      })
      .then(expectShape(favoriteListShape)),
  /** 상품별 찜 수(공개, 회원과 자녀를 합친 수) */
  summary: (productId: string) =>
    apiClient
      .get<FavoriteSummaryDto>('/favorites/summary', { params: { productId } })
      .then(expectShape(favoriteSummaryShape)),
}
