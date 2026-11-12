import { toImageUrl } from '@/shared/lib'
import type { FavoriteItemDto, FavoriteListDto, FavoriteSummaryDto } from '../api/favorite.dto'
import type { FavoriteDisplayStatus, FavoriteItem, FavoriteSummary } from './favorite'

const DISPLAY_STATUSES: readonly string[] = [
  'ON_SALE',
  'SOLD_OUT',
  'SALE_ENDED',
] satisfies FavoriteDisplayStatus[]

function toDisplayStatus(value: string | null): FavoriteDisplayStatus | null {
  return value !== null && DISPLAY_STATUSES.includes(value)
    ? (value as FavoriteDisplayStatus)
    : null
}

export function toFavoriteItem(dto: FavoriteItemDto): FavoriteItem {
  return {
    productId: dto.productId,
    productName: dto.productName,
    thumbnailUrl: toImageUrl(dto.thumbnailUrl),
    displayStatus: toDisplayStatus(dto.displayStatus),
    favoritedAt: dto.favoritedAt,
  }
}

export function toFavoriteSummary(dto: FavoriteSummaryDto): FavoriteSummary {
  return { productId: dto.productId, count: dto.favoriteCount }
}

/** productIds 필터 응답(여러 번 나눠 부른 것)을 찜한 상품 ID 집합으로 */
export function toFavoritedIds(pages: FavoriteListDto[]): Set<string> {
  return new Set(pages.flatMap((page) => page.items.map((item) => item.productId)))
}
