import { getErrorStatus } from '@/shared/api'
import type { FavoriteOwnerPrincipal } from '../api/favorite-api'
import type { FavoriteDisplayStatus } from './favorite'

/** GET /favorites?productIds= 한 번에 보낼 수 있는 상품 수 (BE INVALID_PRODUCT_IDS: 1~50개) */
export const FAVORITE_IDS_MAX = 50

export const FAVORITE_DISPLAY_STATUS_LABEL: Record<FavoriteDisplayStatus, string> = {
  ON_SALE: '판매 중',
  SOLD_OUT: '품절',
  SALE_ENDED: '판매 종료',
}

/** 내 찜 목록의 사진 위 도장: 품절 · 판매 종료면 그 이름. 판매 중이거나 상태를 모르면 찍지 않는다 */
export function favoriteStampOf(status: FavoriteDisplayStatus | null): string | null {
  return status && status !== 'ON_SALE' ? FAVORITE_DISPLAY_STATUS_LABEL[status] : null
}

/** 내 찜 목록에서 바로 담을 수 있는지: 판매 중일 때만 (상태를 모르면 막는다) */
export function canQuickAddFavorite(status: FavoriteDisplayStatus | null): boolean {
  return status === 'ON_SALE'
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

/** 지운 자녀 계정의 찜 요청인지 (BE 403 FAVORITE_CHILD_ACCOUNT_DELETED). 자녀 화면은 안내 뒤 로그아웃한다 */
export function isDeletedChildAccountError(error: unknown, owner: FavoriteOwnerPrincipal): boolean {
  return owner === 'child' && getErrorStatus(error) === 403
}
