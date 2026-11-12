import type { FavoriteDisplayStatus } from './favorite'

/** GET /favorites?productIds= 한 번에 보낼 수 있는 상품 수 (BE INVALID_PRODUCT_IDS: 1~50개) */
export const FAVORITE_IDS_MAX = 50

export const FAVORITE_DISPLAY_STATUS_LABEL: Record<FavoriteDisplayStatus, string> = {
  ON_SALE: '판매 중',
  SOLD_OUT: '품절',
  SALE_ENDED: '판매 종료',
}

/** 중복을 빼고 정렬해 50개씩 나눈다 (정렬: 같은 상품 묶음이면 쿼리 키가 같도록) */
export function favoriteIdChunks(productIds: readonly string[]): string[][] {
  const unique = [...new Set(productIds)].sort(
    (a, b) => Number(a) - Number(b) || a.localeCompare(b),
  )
  const chunks: string[][] = []
  for (let start = 0; start < unique.length; start += FAVORITE_IDS_MAX)
    chunks.push(unique.slice(start, start + FAVORITE_IDS_MAX))
  return chunks
}

/** 판매 중이 아닌 상품은 찜할 수 없다(BE 409 FAVORITE_PRODUCT_SALE_ENDED). 이미 찜한 것은 뺄 수 있다 */
export function canToggleFavorite({
  isFavorited,
  isSelling,
}: {
  isFavorited: boolean
  isSelling: boolean
}): boolean {
  return isFavorited || isSelling
}
