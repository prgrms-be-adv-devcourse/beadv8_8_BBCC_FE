import { apiClient, expectShape, type Page } from '@/shared/api'
import type {
  AdminPaymentDto,
  AdminPaymentSummaryDto,
  PaymentDetailDto,
  PaymentSummaryDto,
} from './payment.dto'
import {
  adminPaymentPageShape,
  adminPaymentSummaryShape,
  paymentDetailShape,
  paymentPageShape,
} from './payment.shape'

export const paymentApi = {
  /** 주문번호로 거르는 조건이 없어 최근 20건에서 찾는다 */
  list: (page = 0) =>
    apiClient
      .get<Page<PaymentSummaryDto>>('/payments', { params: { page, size: 20 } })
      .then(expectShape(paymentPageShape)),
  /** 관리자 전체 결제 · 환불 (BE #326) */
  adminList: (page = 0) =>
    apiClient
      .get<Page<AdminPaymentDto>>('/admin/payments', { params: { page, size: 50 } })
      .then(expectShape(adminPaymentPageShape)),
  /** 결제일 기준 날짜별 결제 금액 · 건수 + 환불 있는 결제 수. from · to(한국 날짜, 양 끝 포함)를 비우면 오늘 */
  adminSummary: (params: { from?: string; to?: string } = {}) =>
    apiClient
      .get<AdminPaymentSummaryDto>('/admin/payments/summary', { params })
      .then(expectShape(adminPaymentSummaryShape)),
  get: (paymentId: string) =>
    apiClient.get<PaymentDetailDto>(`/payments/${paymentId}`).then(expectShape(paymentDetailShape)),
}
