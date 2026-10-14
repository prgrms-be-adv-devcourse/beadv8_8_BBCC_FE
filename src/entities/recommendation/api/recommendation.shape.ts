import { arr, nullable, num, obj, oneOf, pageOf, str } from '@/shared/api'

const FIT = oneOf(['ROOMY', 'PROPER', 'TIGHT'])

export const sizeRecommendationShape = obj({
  productId: str,
  childId: str,
  recommendedSize: nullable(str),
  fit: nullable(FIT),
  reasons: arr(str),
  sizes: arr(obj({ size: str, minHeightCm: num, maxHeightCm: num, fit: nullable(FIT) })),
})

export const recommendedProductPageShape = pageOf(
  obj({
    productId: str,
    name: str,
    categoryName: str,
    sellerName: str,
    minPrice: num,
    thumbnailUrl: nullable(str),
    recommendedSize: str,
    fit: FIT,
  }),
)
