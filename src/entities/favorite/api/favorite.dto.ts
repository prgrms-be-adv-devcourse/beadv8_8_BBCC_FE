/** GET /favorites 항목 (BE FavoriteListResponse.Item). 상품 정보가 없으면 이름 · 썸네일 · 표시 상태가 null */
export type FavoriteItemDto = {
  productId: string
  productName: string | null
  thumbnailUrl: string | null
  /** ON_SALE · SOLD_OUT · SALE_ENDED */
  displayStatus: string | null
  favoritedAt: string
}

/** GET /favorites (BE FavoriteListResponse). productIds 필터면 nextCursor는 늘 null */
export type FavoriteListDto = { items: FavoriteItemDto[]; nextCursor: string | null }

/** GET /favorites/summary (BE FavoriteSummaryResponse) */
export type FavoriteSummaryDto = { productId: string; favoriteCount: number }
