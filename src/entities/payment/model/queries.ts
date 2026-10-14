import { useQuery } from '@tanstack/react-query'
import { paymentApi } from '../api/payment-api'
import { toAdminPayment, toPayment } from './payment.mapper'

export const paymentKeys = {
  list: ['payments', 'list'] as const,
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
    select: (page) => page.content.map(toAdminPayment),
  })
}
