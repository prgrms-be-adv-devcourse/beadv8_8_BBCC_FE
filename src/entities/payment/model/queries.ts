import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { paymentApi } from '../api/payment-api'
import { toAdminPayment, toPayment } from './payment.mapper'

export const paymentKeys = {
  list: ['payments', 'list'] as const,
  listPage: (page: number) => ['payments', 'list', page] as const,
  adminPage: (page: number) => ['payments', 'admin', page] as const,
}

/** 내 결제 내역 (최신순 20건씩, page는 0부터) */
export function usePaymentsQuery({
  enabled = true,
  page = 0,
}: { enabled?: boolean; page?: number } = {}) {
  return useQuery({
    enabled,
    queryKey: paymentKeys.listPage(page),
    queryFn: () => paymentApi.list(page),
    select: (result) => result.content.map(toPayment),
  })
}

/** 관리자 전체 결제 (50건씩, page는 0부터). 쪽을 넘기는 동안 앞 쪽을 보여 준다 */
export function useAdminPaymentsQuery(page = 0) {
  return useQuery({
    queryKey: paymentKeys.adminPage(page),
    queryFn: () => paymentApi.adminList(page),
    select: (result) => ({ ...result, content: result.content.map(toAdminPayment) }),
    placeholderData: keepPreviousData,
  })
}
