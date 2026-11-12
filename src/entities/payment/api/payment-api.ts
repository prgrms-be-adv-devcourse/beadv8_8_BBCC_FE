import { apiClient, expectShape, type Page } from '@/shared/api'
import type { AdminPaymentDto, PaymentDetailDto, PaymentSummaryDto } from './payment.dto'
import { adminPaymentPageShape, paymentDetailShape, paymentPageShape } from './payment.shape'

export const paymentApi = {
  /** 주문번호로 거르는 조건이 없어 최근 20건에서 찾는다 */
  list: () =>
    apiClient
      .get<Page<PaymentSummaryDto>>('/payments', { params: { page: 0, size: 20 } })
      .then(expectShape(paymentPageShape)),
  /** 관리자 전체 결제 · 환불 (기획서 8장 보완). 백엔드에 아직 없어 목 응답이다 */
  adminList: () =>
    apiClient
      .get<Page<AdminPaymentDto>>('/admin/payments', { params: { page: 0, size: 50 } })
      .then(expectShape(adminPaymentPageShape)),
  get: (paymentId: string) =>
    apiClient.get<PaymentDetailDto>(`/payments/${paymentId}`).then(expectShape(paymentDetailShape)),
  /** 그 주문의 내 결제 (0 또는 1건, 남의 주문이면 빈 목록) */
  listOfOrder: (orderId: string) =>
    apiClient
      .get<Page<PaymentSummaryDto>>('/payments', { params: { orderId } })
      .then(expectShape(paymentPageShape)),
}
