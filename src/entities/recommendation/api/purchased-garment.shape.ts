import { nullable, num, obj, oneOf, pageOf, recordOf, str } from '@/shared/api'

export const purchasedGarmentPageShape = pageOf(
  obj({
    orderItemId: str,
    productId: str,
    productName: nullable(str),
    categoryId: nullable(str),
    part: nullable(oneOf(['TOP', 'BOTTOM', 'OUTER', 'DRESS', 'SKIRT'])),
    size: str,
    measurements: nullable(recordOf(num)),
    confirmedAt: str,
  }),
)
