import type {
  WishDto,
  WishItemDto,
  WishLineDto,
  WishRequestDto,
  WishTimelineDto,
} from '../api/wish.dto'
import type { Wish, WishLine, WishRequest, WishRequestLine, WishTimeline } from './wish'

function toProduct(item: WishItemDto | WishLineDto) {
  return {
    wishItemId: item.wishItemId,
    optionId: item.optionId,
    productId: item.productId,
    sellerId: item.sellerId,
    productName: item.productName || '판매가 끝난 상품',
    optionName: item.optionName,
    size: item.size,
    sellerName: item.sellerName,
    unitPrice: item.unitPrice,
    purchasable: item.purchasable,
    saleStatus: item.saleStatus,
  }
}
function toRequestLine(item: WishItemDto): WishRequestLine {
  return {
    ...toProduct(item),
    requestedQuantity: item.requestedQuantity,
    approvedQuantity: item.approvedQuantity,
  }
}
function toLine(item: WishLineDto): WishLine {
  return {
    ...toProduct(item),
    childId: item.childId,
    quantity: item.quantity,
    lineAmount: item.lineAmount,
    addedBy: item.addedBy,
    addedAt: item.addedAt,
    requestId: item.requestId,
  }
}
export function toWishTimeline(dto: WishTimelineDto): WishTimeline {
  return {
    requestId: dto.requestId,
    status: dto.status,
    checkout: dto.checkout,
    rejectReason: dto.rejectReason,
    orderId: dto.orderId,
    steps: dto.steps.map((step) => ({ step: step.step, status: step.status, at: step.at })),
  }
}
export function toWishRequest(dto: WishRequestDto): WishRequest {
  return {
    requestId: dto.requestId,
    childId: dto.childId,
    status: dto.status,
    requestedBy: dto.requestedBy,
    message: dto.message,
    requestedAt: dto.requestedAt,
    checkout: dto.checkout,
    orderId: dto.orderId,
    orderResult: dto.orderResult,
    rejectReason: dto.rejectReason,
    decidedAt: dto.decidedAt,
    items: dto.items.map(toRequestLine),
  }
}
export function toWish(dto: WishDto): Wish {
  return { childId: dto.childId, items: dto.items.map(toLine), totalAmount: dto.totalAmount }
}
