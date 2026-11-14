export type { FavoriteDisplayStatus, FavoriteItem, FavoriteSummary } from './model/favorite'
export { toFavoritedIds, toFavoriteItem, toFavoriteSummary } from './model/favorite.mapper'
export {
  canQuickAddFavorite,
  canToggleFavorite,
  FAVORITE_DISPLAY_STATUS_LABEL,
  FAVORITE_IDS_MAX,
  favoriteIdChunks,
  favoriteStampOf,
} from './model/favorite.rules'
export {
  favoriteKeys,
  useFavoritedIdsQuery,
  useFavoriteSummaryQuery,
  useMyFavoritesQuery,
} from './model/queries'
