import { arr, bool, nullable, num, obj, oneOf, str } from '@/shared/api'

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

/** 공통 목록 응답(PageResponse) 6칸 + 목록 기준 시각 asOf */
export const recommendedProductPageShape = obj({
  content: arr(
    obj({
      productId: str,
      name: str,
      thumbnailUrl: nullable(str),
      businessName: nullable(str),
      minPrice: nullable(num),
      recommendedSize: nullable(str),
    }),
  ),
  page: num,
  size: num,
  totalElements: num,
  totalPages: num,
  hasNext: bool,
  asOf: str,
})
