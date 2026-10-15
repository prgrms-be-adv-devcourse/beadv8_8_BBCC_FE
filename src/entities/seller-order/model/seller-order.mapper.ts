import type { DeliveryStatus } from '@/shared/config'
import type { SellerOrderDto } from '../api/seller-order.dto'
import type { SellerOrder } from './seller-order'

export function toSellerOrder(dto: SellerOrderDto): SellerOrder {
  return {
    id: dto.sellerOrderId,
    orderId: dto.orderId,
    status: dto.status as DeliveryStatus,
    carrier: dto.carrier,
    trackingNumber: dto.trackingNumber,
    orderedAt: dto.orderedAt,
    recipientName: dto.shippingAddress.recipientName,
    address: dto.shippingAddress.address,
    items: dto.items.map((item) => ({
      id: item.orderItemId,
      productName: item.productName,
      optionName: item.optionName ?? null,
      size: item.size,
      quantity: item.quantity,
      amount: item.amount,
      childLabel: item.child ? `${item.child.name}(${item.child.heightCm}cm)` : null,
    })),
  }
}
