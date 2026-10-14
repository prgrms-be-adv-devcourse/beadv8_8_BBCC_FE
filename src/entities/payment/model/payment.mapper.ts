import type { AdminPaymentDto, PaymentSummaryDto } from '../api/payment.dto'
import type { AdminPayment, Payment, PaymentFailureCode, PaymentStatus } from './payment'

/** 결제 도메인 ID(숫자)를 문자열로 바꿔 주문 쪽 ID와 비교할 수 있게 한다 */
export function toPayment(dto: PaymentSummaryDto): Payment {
  return {
    id: String(dto.paymentId),
    orderId: String(dto.orderId),
    amount: dto.amount,
    refundedAmount: dto.refundedAmount,
    status: dto.status as PaymentStatus,
    failureCode: dto.failureCode as PaymentFailureCode | null,
    paidAt: dto.paidAt,
    createdAt: dto.createdAt,
  }
}

export function toAdminPayment(dto: AdminPaymentDto): AdminPayment {
  return { ...toPayment(dto), memberId: String(dto.memberId) }
}
