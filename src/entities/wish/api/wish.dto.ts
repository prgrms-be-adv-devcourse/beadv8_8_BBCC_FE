export type WishItemDto = {
  wishItemId: string
  optionId: string
  productId: string | null
  sellerId: string | null
  productName: string | null
  optionName: string | null
  size: string | null
  sellerName: string | null
  requestedQuantity: number
  approvedQuantity: number | null
  unitPrice: number | null
  purchasable: boolean
  saleStatus: string | null
}

export type WishRequestDto = {
  requestId: string
  childId: string
  status: 'REQUESTED' | 'APPROVED' | 'REJECTED'
  requestedBy: 'PARENT' | 'CHILD'
  message: string | null
  requestedAt: string
  checkout: 'ORDER' | 'CART' | null
  orderId: string | null
  orderResult: 'PAID' | 'CANCELLED' | null
  rejectReason: 'TOO_EXPENSIVE' | 'ALREADY_HAVE' | 'NEXT_TIME' | 'OTHER' | null
  decidedAt: string | null
  items: WishItemDto[]
}

export type WishLineDto = Omit<WishItemDto, 'requestedQuantity' | 'approvedQuantity'> & {
  childId: string
  quantity: number
  lineAmount: number
  addedBy: 'PARENT' | 'CHILD'
  addedAt: string
  requestId: string | null
}

export type WishDto = { childId: string; items: WishLineDto[]; totalAmount: number }
export type WishTimelineDto = {
  requestId: string
  status: string
  checkout: string | null
  rejectReason: string | null
  orderId: string | null
  steps: {
    step: string
    status: 'DONE' | 'PARTIAL' | 'WAITING' | 'NOT_APPLICABLE'
    at: string | null
  }[]
}
