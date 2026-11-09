import { arr, bool, nullable, num, obj, str } from '@/shared/api'

const review = {
  reviewId: str,
  orderItemId: str,
  productId: str,
  rating: num,
  content: str,
  nickname: nullable(str),
  authorWithdrawn: bool,
  fit: nullable(str),
  purchasedSize: nullable(str),
  imageUrls: arr(str),
  createdAt: str,
  updatedAt: str,
}
export const reviewShape = obj(review)
export const reviewListShape = obj({
  items: arr(
    obj({
      ...review,
      productName: nullable(str),
      thumbnailUrl: nullable(str),
      displayStatus: nullable(str),
      visibility: str,
    }),
  ),
  nextCursor: nullable(str),
})
export const reviewSummaryShape = obj({
  productId: str,
  reviewCount: num,
  averageRating: nullable(num),
  fitSummary: obj({ small: num, trueToSize: num, large: num }),
})
export const reviewableItemsShape = obj({
  items: arr(
    obj({
      orderItemId: str,
      orderId: nullable(str),
      productId: str,
      productName: nullable(str),
      thumbnailUrl: nullable(str),
      size: nullable(str),
      confirmedAt: str,
    }),
  ),
  nextCursor: nullable(str),
})
