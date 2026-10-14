import type { DeliveryStatus } from '@/shared/config'
import type {
  AdminOrderDto,
  OrderDetailDto,
  OrderSummaryDto,
  PlaceOrderRequestDto,
} from '../api/order.dto'
import type {
  AdminOrder,
  CancelReason,
  ConfirmType,
  Order,
  OrderItemStatus,
  OrderStatus,
  OrderSummary,
  PlaceOrderInput,
} from './order'

export function toOrder(dto: OrderDetailDto): Order {
  return {
    id: dto.orderId,
    status: dto.status as OrderStatus,
    cancelReason: dto.cancelReason as CancelReason | null,
    totalAmount: dto.totalAmount,
    orderedAt: dto.orderedAt,
    shippingAddress: dto.shippingAddress,
    items: dto.items.map((item) => ({
      id: item.orderItemId,
      productId: item.productId,
      optionId: item.optionId,
      sellerId: item.sellerId,
      productName: item.productName,
      size: item.size,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      amount: item.amount,
      status: item.status as OrderItemStatus,
      deliveredAt: item.deliveredAt,
      confirmedAt: item.confirmedAt,
      confirmType: item.confirmType as ConfirmType | null,
      child: item.child && {
        id: item.child.childId,
        name: item.child.name,
        heightCm: item.child.heightCm,
        weightKg: item.child.weightKg,
      },
    })),
    deliveries: dto.deliveries.map((delivery) => ({
      id: delivery.sellerOrderId,
      sellerId: delivery.sellerId,
      status: delivery.status as DeliveryStatus,
      carrier: delivery.carrier,
      trackingNumber: delivery.trackingNumber,
      shippedAt: delivery.shippedAt,
      deliveredAt: delivery.deliveredAt,
    })),
  }
}

export function toOrderSummary(dto: OrderSummaryDto): OrderSummary {
  return {
    id: dto.orderId,
    status: dto.status as OrderStatus,
    totalAmount: dto.totalAmount,
    orderedAt: dto.orderedAt,
  }
}

/** 주문 쪽 요청은 ID가 숫자(Long)다 */
export function toPlaceOrderRequest(input: PlaceOrderInput): PlaceOrderRequestDto {
  return {
    items: input.items.map((item) => ({
      optionId: Number(item.optionId),
      childId: item.childId === null ? null : Number(item.childId),
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
    shippingAddress: input.shippingAddress,
  }
}

export function toAdminOrder(dto: AdminOrderDto): AdminOrder {
  return {
    id: dto.orderId,
    memberId: String(dto.memberId),
    status: dto.status as OrderStatus,
    cancelReason: dto.cancelReason as CancelReason | null,
    totalAmount: dto.totalAmount,
    orderedAt: dto.orderedAt,
    itemCount: dto.itemCount,
  }
}
