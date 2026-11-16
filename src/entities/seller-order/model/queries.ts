import { keepPreviousData, useQueries, useQuery } from '@tanstack/react-query'
import type { DeliveryStatus } from '@/shared/config'
import { sellerOrderApi } from '../api/seller-order-api'
import { toSellerOrder } from './seller-order.mapper'
import {
  SELLER_ORDER_TABS,
  sellerOrderStatusOfTab,
  type SellerOrderTab,
} from './seller-order.rules'

export const sellerOrderKeys = {
  list: ['seller-orders'] as const,
  listPage: (status: DeliveryStatus | null, page: number) =>
    ['seller-orders', status ?? 'ALL', page] as const,
  count: (status: DeliveryStatus | null) => ['seller-orders', 'count', status ?? 'ALL'] as const,
}

/** 판매 주문 한 페이지 (page는 0부터). status를 주면 서버가 그 배송 상태만 준다 (BE #1280) */
export function useSellerOrdersQuery(page = 0, status: DeliveryStatus | null = null) {
  return useQuery({
    queryKey: sellerOrderKeys.listPage(status, page),
    queryFn: () => sellerOrderApi.list(page, status),
    placeholderData: keepPreviousData,
    select: (page) => ({ ...page, content: page.content.map(toSellerOrder) }),
  })
}

/** 탭별 전체 건수 (size 1 요청의 totalElements). 아직 못 받은 탭은 undefined */
export function useSellerOrderTabCountsQuery(): Record<SellerOrderTab, number | undefined> {
  return useQueries({
    queries: SELLER_ORDER_TABS.map((tab) => {
      const status = sellerOrderStatusOfTab(tab.value)
      return {
        queryKey: sellerOrderKeys.count(status),
        queryFn: () => sellerOrderApi.list(0, status, 1),
        select: (page: { totalElements: number }) => page.totalElements,
      }
    }),
    combine: (results) =>
      Object.fromEntries(
        SELLER_ORDER_TABS.map((tab, index) => [tab.value, results[index].data]),
      ) as Record<SellerOrderTab, number | undefined>,
  })
}
