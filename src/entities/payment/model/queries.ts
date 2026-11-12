import { useQuery } from '@tanstack/react-query'
import { paymentApi } from '../api/payment-api'
import { toAdminPayment, toAdminPaymentSummary, toPayment } from './payment.mapper'
import { findPaymentOfOrder } from './payment.rules'

export const paymentKeys = {
  list: ['payments', 'list'] as const,
  ofOrder: (orderId: string) => ['payments', 'order', orderId] as const,
}

/** 내 결제 내역 (최신순 20건) */
export function usePaymentsQuery({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    enabled,
    queryKey: paymentKeys.list,
    queryFn: paymentApi.list,
    select: (page) => page.content.map(toPayment),
  })
}

export function useAdminPaymentsQuery() {
  return useQuery({
    queryKey: ['payments', 'admin'] as const,
    queryFn: paymentApi.adminList,
    select: (page) => ({ ...page, content: page.content.map(toAdminPayment) }),
  })
}

/** 주문 하나의 내 결제 (없으면 null) */
export function useOrderPaymentQuery(
  orderId: string,
  { enabled = true }: { enabled?: boolean } = {},
) {
  return useQuery({
    enabled,
    queryKey: paymentKeys.ofOrder(orderId),
    queryFn: () => paymentApi.listOfOrder(orderId),
    select: (page) => findPaymentOfOrder(page.content.map(toPayment), orderId),
  })
}

/** 관리자 결제 요약 (from · to: 한국 날짜, 양 끝 포함, 최대 31일) */
export function useAdminPaymentSummaryQuery(from: string, to: string) {
  return useQuery({
    queryKey: ['payments', 'admin', 'summary', from, to] as const,
    queryFn: () => paymentApi.adminSummary({ from, to }),
    select: toAdminPaymentSummary,
  })
}
