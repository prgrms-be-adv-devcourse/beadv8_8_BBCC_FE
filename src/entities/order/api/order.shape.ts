import { arr, nullable, num, obj, oneOf, pageOf, str } from '@/shared/api'

const ORDER_STATUS = ['PENDING_PAYMENT', 'PAID', 'CANCELLED']
const DELIVERY_STATUS = ['READY', 'SHIPPING', 'DELIVERED']

const shippingAddressShape = obj({
  recipientName: str,
  phone: str,
  zipCode: str,
  address: str,
})

const orderItemShape = obj({
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
})

export const orderDetailShape = obj({
  orderId: str,
  status: oneOf(ORDER_STATUS),
  cancelReason: nullable(oneOf(['OUT_OF_STOCK', 'PAYMENT_FAILED', 'PAYMENT_EXPIRED'])),
  totalAmount: num,
  orderedAt: str,
  paymentDueAt: nullable(str),
  shippingAddress: shippingAddressShape,
  items: arr(orderItemShape),
  deliveries: arr(
    obj({
      sellerOrderId: str,
      sellerId: str,
      status: oneOf(DELIVERY_STATUS),
      carrier: nullable(str),
      trackingNumber: nullable(str),
      shippedAt: nullable(str),
      deliveredAt: nullable(str),
    }),
  ),
})

export const orderPageShape = pageOf(
  obj({ orderId: str, status: oneOf(ORDER_STATUS), totalAmount: num, orderedAt: str }),
)

export const adminOrderPageShape = pageOf(
  obj({
    orderId: str,
    memberId: num,
    status: oneOf(ORDER_STATUS),
    cancelReason: nullable(oneOf(['OUT_OF_STOCK', 'PAYMENT_FAILED', 'PAYMENT_EXPIRED'])),
    totalAmount: num,
    orderedAt: str,
    itemCount: num,
  }),
)
