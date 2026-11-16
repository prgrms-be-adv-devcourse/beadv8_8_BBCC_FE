import { toImageUrl } from '@/shared/lib'
import type { WishRequestDto, WishRequestLineDto, WishTimelineDto } from '../api/wish.dto'
import type { WishRequest, WishRequestLine, WishTimeline } from './wish'

function toLine(item: WishRequestLineDto, dto: WishRequestDto): WishRequestLine {
  return {
    cartItemId: item.cartItemId,
    optionId: item.optionId,
    productId: item.productId,
    sellerId: item.sellerId,
    productName: item.productName || '판매가 끝난 상품',
    optionName: item.optionName,
    size: item.size,
    sellerName: item.sellerName,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    purchasable: item.purchasable,
    saleStatus: item.saleStatus,
    thumbnailUrl: toImageUrl(item.thumbnailUrl),
    purchasedQuantity: dto.purchases
      .filter((purchase) => item.cartItemId !== null && purchase.cartItemId === item.cartItemId)
      .reduce((sum, purchase) => sum + purchase.quantity, 0),
  }
}
export function toWishTimeline(dto: WishTimelineDto): WishTimeline {
  return {
    requestId: dto.requestId,
    status: dto.status,
    orderIds: [...dto.orderIds],
    steps: dto.steps.map((step) => ({ step: step.step, status: step.status, at: step.at })),
  }
}
export function toWishRequest(dto: WishRequestDto): WishRequest {
  return {
    requestId: dto.requestId,
    childId: dto.childId,
    status: dto.status,
    requestedByType: dto.requestedByType,
    message: dto.message,
    requestedAt: dto.requestedAt,
    decidedAt: dto.paidAt ?? dto.rejectedAt ?? dto.cancelledAt,
    expiresAt: dto.expiresAt,
    expiredAt: dto.expiredAt,
    rejectReason: dto.rejectReason,
    orderIds: [...new Set(dto.purchases.map((purchase) => purchase.orderId))],
    paidOrderItemIds: [...dto.paidOrderItemIds],
    items: dto.items.map((item) => toLine(item, dto)),
  }
}
