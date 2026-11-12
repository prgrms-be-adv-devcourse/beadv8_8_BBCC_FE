/** 찜 목록 · 리뷰에 보이는 상품 표시 상태 (BE DisplayStatus) */
export type FavoriteDisplayStatus = 'ON_SALE' | 'SOLD_OUT' | 'SALE_ENDED'

export type FavoriteItem = {
  productId: string
  productName: string | null
  thumbnailUrl: string | null
  /** 상품 정보가 없거나 모르는 값이면 null */
  displayStatus: FavoriteDisplayStatus | null
  favoritedAt: string
}

export type FavoriteSummary = { productId: string; count: number }
