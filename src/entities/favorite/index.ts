export type { FavoriteDisplayStatus, FavoriteItem, FavoriteSummary } from './model/favorite'
export { toFavoritedIds, toFavoriteItem, toFavoriteSummary } from './model/favorite.mapper'
export {
  canToggleFavorite,
  FAVORITE_DISPLAY_STATUS_LABEL,
  FAVORITE_IDS_MAX,
  favoriteIdChunks,
} from './model/favorite.rules'
export {
  favoriteKeys,
  useFavoritedIdsQuery,
  useFavoriteSummaryQuery,
  useMyFavoritesQuery,
} from './model/queries'

// 목 응답 · 가짜 백엔드 계약 작성 전용
export type { FavoriteListDto as MockFavoriteListDto } from './api/favorite.dto'
