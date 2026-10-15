import { arr, nullable, num, obj, oneOf, pageOf, str } from '@/shared/api'

const FIT = oneOf(['ROOMY', 'PROPER', 'TIGHT'])

export const sizeRecommendationShape = obj({
  productId: str,
  childId: str,
  recommendedSize: nullable(str),
  fit: nullable(FIT),
  notices: arr(obj({ code: str, message: str })),
  candidateSizes: arr(str),
  lastPurchasedSize: nullable(str),
})

export const recommendedProductPageShape = pageOf(
  obj({
    productId: str,
    name: str,
    thumbnailUrl: nullable(str),
    businessName: nullable(str),
    minPrice: nullable(num),
    recommendedSize: nullable(str),
  }),
)
