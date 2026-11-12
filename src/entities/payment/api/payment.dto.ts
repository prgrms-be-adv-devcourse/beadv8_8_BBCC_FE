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

/** GET /admin/payments 한 줄 (BE #326) */
export type AdminPaymentDto = PaymentSummaryDto & { memberId: number }

/** GET /admin/payments/summary (BE AdminPaymentSummaryResponse). 날짜는 한국 시간 yyyy-MM-dd */
export type AdminPaymentSummaryDto = {
  /** 조회 기간의 날마다 한 줄(오름차순). 결제일 기준, 실패 결제 제외, 환불 전 금액. 결제 없는 날은 0 */
  daily: { date: string; paidAmount: number; paidCount: number }[]
  /** 환불 이력이 있는 결제(부분 · 전액 환불) 전체 건수. 기간과 상관없다 */
  refundedPaymentCount: number
}
