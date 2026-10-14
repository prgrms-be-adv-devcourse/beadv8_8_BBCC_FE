/** GET /payments (내 결제 내역, 최신순) 한 줄. 결제 도메인 ID는 숫자다 */
export type PaymentSummaryDto = {
  paymentId: number
  orderId: number
  amount: number
  refundedAmount: number
  /** COMPLETED · FAILED · PARTIALLY_REFUNDED · REFUNDED */
  status: string
  /** 실패 결제만 값이 있다 (INSUFFICIENT_BALANCE 등) */
  failureCode: string | null
  /** 실패 결제는 null */
  paidAt: string | null
  createdAt: string
}

/** GET /payments/{paymentId} */
export type PaymentDetailDto = PaymentSummaryDto & {
  /** 실패 결제는 빈 목록 */
  items: { orderItemId: number; amount: number; refundedAmount: number }[]
}

/** GET /admin/payments 한 줄 (기획서 8장 보완 · BE 미구현 → 목) */
export type AdminPaymentDto = PaymentSummaryDto & { memberId: number }
