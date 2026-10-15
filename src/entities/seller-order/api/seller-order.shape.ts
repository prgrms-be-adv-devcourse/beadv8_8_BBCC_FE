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
        child: nullable(
          obj({ childId: str, name: str, heightCm: num, weightKg: num, bodyType: nullable(str) }),
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
