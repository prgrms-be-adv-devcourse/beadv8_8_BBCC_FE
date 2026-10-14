import { arr, nullable, num, obj, oneOf, pageOf, str } from '@/shared/api'

const fields = {
  paymentId: num,
  orderId: num,
  amount: num,
  refundedAmount: num,
  status: oneOf(['COMPLETED', 'FAILED', 'PARTIALLY_REFUNDED', 'REFUNDED']),
  failureCode: nullable(oneOf(['INSUFFICIENT_BALANCE', 'WALLET_NOT_FOUND', 'AMOUNT_MISMATCH'])),
  paidAt: nullable(str),
  createdAt: str,
}

export const paymentPageShape = pageOf(obj(fields))
export const adminPaymentPageShape = pageOf(obj({ ...fields, memberId: num }))
export const paymentDetailShape = obj({
  ...fields,
  items: arr(obj({ orderItemId: num, amount: num, refundedAmount: num })),
})
