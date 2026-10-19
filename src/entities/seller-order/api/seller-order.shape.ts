import { arr, nullable, num, obj, oneOf, pageOf, str } from '@/shared/api'

export const sellerOrderPageShape = pageOf(
  obj({
    sellerOrderId: str,
    orderId: str,
    status: oneOf(['READY', 'SHIPPING', 'DELIVERED']),
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
        status: oneOf(['ORDERED', 'CONFIRMED']),
        deliveredAt: nullable(str),
        confirmedAt: nullable(str),
        confirmType: nullable(oneOf(['DIRECT', 'AUTO'])),
        // 주문 상세의 주문상품과 같은 모양: 품절 사유(기본 null) · 판매자 상호(판매 주문 목록에서는 null)
        unavailableReason: nullable(str),
        sellerName: nullable(str),
        child: nullable(
          obj({
            childId: str,
            // 주문 당시 자녀 이름: 회원의 자녀 변경 이벤트에 이름이 없어 null일 수 있다
            name: nullable(str),
            heightCm: num,
            weightKg: num,
            bodyType: nullable(str),
          }),
        ),
      }),
    ),
  }),
)

/** POST /seller/orders/{id}/ship · /deliver (BE DeliveryResponse) */
export const deliveryShape = obj({
  sellerOrderId: str,
  orderId: str,
  status: oneOf(['READY', 'SHIPPING', 'DELIVERED']),
  carrier: nullable(str),
  trackingNumber: nullable(str),
  shippedAt: nullable(str),
  deliveredAt: nullable(str),
})
