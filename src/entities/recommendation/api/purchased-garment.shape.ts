import { nullable, num, obj, pageOf, recordOf, str } from '@/shared/api'

export const purchasedGarmentPageShape = pageOf(
  obj({
    orderItemId: str,
    productId: str,
    productName: nullable(str),
    categoryId: nullable(str),
    size: str,
    measurements: nullable(recordOf(num)),
    confirmedAt: str,
  }),
)
