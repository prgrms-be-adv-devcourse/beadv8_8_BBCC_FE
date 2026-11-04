export type WishStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED'
export type WishOrderResult = 'PAID' | 'CANCELLED' | null
type WishProduct = {
  wishItemId: string
  optionId: string
  productId: string | null
  sellerId: string | null
  productName: string
  optionName: string | null
  size: string | null
  sellerName: string | null
  unitPrice: number | null
  purchasable: boolean
  saleStatus: string | null
}
export type WishRequestLine = WishProduct & {
  requestedQuantity: number
  approvedQuantity: number | null
}
export type WishLine = WishProduct & {
  childId: string
  quantity: number
  lineAmount: number
  addedBy: 'PARENT' | 'CHILD'
  addedAt: string
  requestId: string | null
}
export type Wish = { childId: string; items: WishLine[]; totalAmount: number }
export type WishRequest = {
  requestId: string
  childId: string
  status: WishStatus
  requestedBy: 'PARENT' | 'CHILD'
  message: string | null
  requestedAt: string
  checkout: 'ORDER' | 'CART' | null
  orderId: string | null
  orderResult: WishOrderResult
  rejectReason: 'TOO_EXPENSIVE' | 'ALREADY_HAVE' | 'NEXT_TIME' | 'OTHER' | null
  decidedAt: string | null
  items: WishRequestLine[]
}
export type WishTimelineStep = {
  step: string
  status: 'DONE' | 'PARTIAL' | 'WAITING' | 'NOT_APPLICABLE'
  at: string | null
}
export type WishTimeline = {
  requestId: string
  status: string
  checkout: string | null
  rejectReason: string | null
  orderId: string | null
  steps: WishTimelineStep[]
}
