export type PaymentStatus = 'COMPLETED' | 'FAILED' | 'PARTIALLY_REFUNDED' | 'REFUNDED'
export type PaymentFailureCode = 'INSUFFICIENT_BALANCE' | 'WALLET_NOT_FOUND' | 'AMOUNT_MISMATCH'

/** 결제 도메인의 주문 결제 1건 (주문당 하나) */
export type Payment = {
  id: string
  orderId: string
  amount: number
  refundedAmount: number
  status: PaymentStatus
  failureCode: PaymentFailureCode | null
  paidAt: string | null
  createdAt: string
}

/** 결제 확인에 필요한 주문 값만 받는다 (엔티티끼리 import하지 않으려고) */
export type OrderPaymentInput = {
  id: string
  status: 'PENDING_PAYMENT' | 'PAID' | 'CANCELLED'
  cancelReason: 'OUT_OF_STOCK' | 'PAYMENT_FAILED' | 'PAYMENT_EXPIRED' | null
  totalAmount: number
}

/** 주문 상태와 결제 기록을 맞춰 본 결과 */
export type PaymentCheckResult = 'MATCH' | 'WAITING' | 'MISMATCH' | 'INFO'
export type PaymentCheck = { result: PaymentCheckResult; message: string }

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  COMPLETED: '결제 완료',
  FAILED: '결제 실패',
  PARTIALLY_REFUNDED: '부분 환불',
  REFUNDED: '환불 완료',
}

export const PAYMENT_FAILURE_LABEL: Record<PaymentFailureCode, string> = {
  INSUFFICIENT_BALANCE: '예치금 잔액 부족',
  WALLET_NOT_FOUND: '지갑 없음',
  AMOUNT_MISMATCH: '주문 금액 불일치',
}
