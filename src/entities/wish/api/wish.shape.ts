import { arr, bool, nullable, num, obj, oneOf, str } from '@/shared/api'

const item = {
  wishItemId: str,
  optionId: str,
  productId: nullable(str),
  sellerId: nullable(str),
  productName: nullable(str),
  optionName: nullable(str),
  size: nullable(str),
  sellerName: nullable(str),
  unitPrice: nullable(num),
  purchasable: bool,
  saleStatus: nullable(str),
}
export const wishLineShape = obj({
  ...item,
  childId: str,
  quantity: num,
  lineAmount: num,
  addedBy: oneOf(['PARENT', 'CHILD']),
  addedAt: str,
  requestId: nullable(str),
})
export const wishShape = obj({
  childId: str,
  items: arr(wishLineShape),
  totalAmount: num,
})
export const wishRequestShape = obj({
  requestId: str,
  childId: str,
  status: oneOf(['REQUESTED', 'APPROVED', 'REJECTED']),
  requestedBy: oneOf(['PARENT', 'CHILD']),
  message: nullable(str),
  requestedAt: str,
  checkout: nullable(oneOf(['ORDER', 'CART'])),
  orderId: nullable(str),
  orderResult: nullable(oneOf(['PAID', 'CANCELLED'])),
  rejectReason: nullable(oneOf(['TOO_EXPENSIVE', 'ALREADY_HAVE', 'NEXT_TIME', 'OTHER'])),
  decidedAt: nullable(str),
  items: arr(obj({ ...item, requestedQuantity: num, approvedQuantity: nullable(num) })),
})
export const wishRequestsShape = arr(wishRequestShape)
export const wishTimelineShape = obj({
  requestId: str,
  status: str,
  checkout: nullable(str),
  rejectReason: nullable(str),
  orderId: nullable(str),
  steps: arr(
    obj({
      step: str,
      status: oneOf(['DONE', 'PARTIAL', 'WAITING', 'NOT_APPLICABLE']),
      at: nullable(str),
    }),
  ),
})
