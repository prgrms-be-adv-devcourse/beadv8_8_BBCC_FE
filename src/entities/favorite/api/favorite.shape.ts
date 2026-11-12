import { arr, nullable, num, obj, str } from '@/shared/api'

export const favoriteListShape = obj({
  items: arr(
    obj({
      productId: str,
      productName: nullable(str),
      thumbnailUrl: nullable(str),
      displayStatus: nullable(str),
      favoritedAt: str,
    }),
  ),
  nextCursor: nullable(str),
})
export const favoriteSummaryShape = obj({ productId: str, favoriteCount: num })
