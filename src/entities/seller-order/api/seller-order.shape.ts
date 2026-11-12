import { arr, nullable, num, obj, oneOf, pageOf, str } from '@/shared/api'

export const sellerOrderPageShape = pageOf(
  obj({
    sellerOrderId: str,
    orderId: str,
    status: oneOf(['READY', 'SHIPPING', 'DELIVERED', 'CANCELLED']),
    carrier: nullable(str),
    trackingNumber: nullable(str),
    shippedAt: nullable(str),
    deliveredAt: nullable(str),
    orderedAt: str,
    shippingAddress: obj({ recipientName: str, phone: str, zipCode: str, address: str }),
    items: arr(
      obj({
        orderItemId: str,
        productId: str,
        optionId: str,
        sellerId: str,
        productName: str,
        optionName: nullable(str),
        size: nullable(str),
        unitPrice: num,
        quantity: num,
        amount: num,
        status: oneOf(['ORDERED', 'CONFIRMED', 'CANCELLED']),
        deliveredAt: nullable(str),
        confirmedAt: nullable(str),
        confirmType: nullable(oneOf(['DIRECT', 'AUTO'])),
        // 주문 상세의 주문상품과 같은 모양: 품절 사유(기본 null) · 판매자 상호(판매 주문 목록에서는 null).
        // 자녀(child) 칸은 없다 (BE #997, 판매자에게 자녀 정보를 넘기지 않음)
        unavailableReason: nullable(str),
        sellerName: nullable(str),
      }),
    ),
  }),
)

/** POST /seller/orders/{id}/ship · /deliver (BE DeliveryResponse) */
export const deliveryShape = obj({
  sellerOrderId: str,
  orderId: str,
  status: oneOf(['READY', 'SHIPPING', 'DELIVERED', 'CANCELLED']),
  carrier: nullable(str),
  trackingNumber: nullable(str),
  shippedAt: nullable(str),
  deliveredAt: nullable(str),
})
