import { keepPreviousData, useQueries, useQuery } from '@tanstack/react-query'
import { orderApi } from '../api/order-api'
import { toAdminOrder, toOrder, toOrderSummary } from './order.mapper'
import { toChildPurchase } from './child-purchase'
import { toOrderHistory } from './order-history'
import { toOrderTimeline } from './order-timeline'
import type { OrderStatus } from './order'
import {
  isAwaitingPayment,
  ORDER_TABS,
  orderStatusOfTab,
  paymentPollInterval,
  type OrderTab,
} from './order.rules'

export const orderKeys = {
  list: ['orders', 'list'] as const,
  listPage: (status: OrderStatus | null, page: number) =>
    ['orders', 'list', status ?? 'ALL', page] as const,
  count: (status: OrderStatus | null) => ['orders', 'list', 'count', status ?? 'ALL'] as const,
  admin: ['orders', 'admin'] as const,
  adminPage: (status: OrderStatus | null, page: number, size: number) =>
    ['orders', 'admin', status ?? 'ALL', page, size] as const,
  adminCancelledSince: (cancelledFrom: string) =>
    ['orders', 'admin', 'cancelled-since', cancelledFrom] as const,
  detail: (orderId: string) => ['orders', 'detail', orderId] as const,
  timeline: (orderId: string, revision: string) =>
    ['orders', 'timeline', orderId, revision] as const,
  childPurchases: (page: number) => ['orders', 'child-purchases', page] as const,
  adminHistory: (orderId: string) => ['orders', 'admin-history', orderId] as const,
}

/** 내 주문 한 페이지 (page는 0부터). status를 주면 서버가 그 상태만 준다 (BE #1280) */
export function useOrdersQuery(page = 0, status: OrderStatus | null = null) {
  return useQuery({
    queryKey: orderKeys.listPage(status, page),
    queryFn: () => orderApi.list(page, status),
    placeholderData: keepPreviousData,
    select: (page) => ({ ...page, content: page.content.map(toOrderSummary) }),
  })
}

/** 내 주문 탭별 전체 건수 (size 1 요청의 totalElements). 아직 못 받은 탭은 undefined */
export function useOrderTabCountsQuery(): Record<OrderTab, number | undefined> {
  return useQueries({
    queries: ORDER_TABS.map((tab) => {
      const status = orderStatusOfTab(tab.value)
      return {
        queryKey: orderKeys.count(status),
        queryFn: () => orderApi.list(0, status, 1),
        select: (page: { totalElements: number }) => page.totalElements,
      }
    }),
    combine: (results) =>
      Object.fromEntries(
        ORDER_TABS.map((tab, index) => [tab.value, results[index].data]),
      ) as Record<OrderTab, number | undefined>,
  })
}

/** 주문별로 결제 처리 중을 처음 본 시각 (이 탭 기준) */
const pendingSince = new Map<string, number>()

/** at(보통 query.dataUpdatedAt) 기준으로 결제 처리 중이 얼마나 이어졌는지 (ms). 처리 중이 아니면 0 */
export function paymentPendingMs(orderId: string, at: number): number {
  const since = pendingSince.get(orderId)
  return since === undefined ? 0 : Math.max(0, at - since)
}

/**
 * 결제 처리 중이면 다시 조회한다 (주문하기는 결과를 주지 않고 서버 이벤트로 이어서 처리된다).
 * 처음 30초는 1초마다, 그 뒤는 10초마다 (서버 이벤트가 오지 않을 때 조회가 흐름 기록을 덮지 않게)
 */
export function useOrderQuery(orderId: string) {
  return useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: () => orderApi.get(orderId),
    select: toOrder,
    refetchInterval: (query) => {
      const { data, dataUpdatedAt } = query.state
      if (!data || !isAwaitingPayment(toOrder(data))) {
        pendingSince.delete(orderId)
        return false
      }
      if (!pendingSince.has(orderId)) pendingSince.set(orderId, dataUpdatedAt)
      return paymentPollInterval(paymentPendingMs(orderId, dataUpdatedAt))
    },
  })
}

/** 관리자 전체 주문 한 페이지 (기본 최근 100건). status를 주면 서버가 그 상태만 준다 (BE #1280) */
export function useAdminOrdersQuery(status: OrderStatus | null, page = 0, size = 100) {
  return useQuery({
    queryKey: orderKeys.adminPage(status, page, size),
    queryFn: () => orderApi.adminList(page, status, size),
    placeholderData: keepPreviousData,
    select: (page) => ({ ...page, content: page.content.map(toAdminOrder) }),
  })
}

/** 그 시각(포함) 이후 취소된 주문 수 (BE #1325, size 1 요청의 totalElements). 관리자 대시보드 오늘 취소 */
export function useAdminCancelledSinceCountQuery(cancelledFrom: string) {
  return useQuery({
    queryKey: orderKeys.adminCancelledSince(cancelledFrom),
    queryFn: () => orderApi.adminList(0, null, 1, cancelledFrom),
    select: (page) => page.totalElements,
  })
}

/** 관리자 탭별 전체 건수: 전체(null) + 주문 상태별 (size 1 요청의 totalElements) */
export function useAdminOrderTabCountsQuery(): Record<OrderTab, number | undefined> {
  return useQueries({
    queries: ORDER_TABS.map((tab) => {
      const status = orderStatusOfTab(tab.value)
      return {
        queryKey: orderKeys.adminPage(status, 0, 1),
        queryFn: () => orderApi.adminList(0, status, 1),
        select: (page: { totalElements: number }) => page.totalElements,
      }
    }),
    combine: (results) =>
      Object.fromEntries(
        ORDER_TABS.map((tab, index) => [tab.value, results[index].data]),
      ) as Record<OrderTab, number | undefined>,
  })
}

/**
 * 주문 처리 타임라인 (BE #352). revision은 주문 상세에서 만든 상태 글자 —
 * 주문 상세가 바뀌면(결제 · 발송 · 확정) 타임라인도 다시 부른다
 */
export function useOrderTimelineQuery(orderId: string, revision: string) {
  return useQuery({
    queryKey: orderKeys.timeline(orderId, revision),
    queryFn: () => orderApi.timeline(orderId),
    select: toOrderTimeline,
    placeholderData: (previous) => previous,
  })
}

/** 나를 위해 산 상품 (자녀 로그인). page는 0부터 */
export function useChildPurchasesQuery(page: number) {
  return useQuery({
    queryKey: orderKeys.childPurchases(page),
    queryFn: () => orderApi.childPurchases(page),
    select: (data) => ({ ...data, content: data.content.map(toChildPurchase) }),
  })
}

/** 관리자 주문 상태 이력 (오래된 것부터) */
export function useAdminOrderHistoryQuery(orderId: string) {
  return useQuery({
    queryKey: orderKeys.adminHistory(orderId),
    queryFn: () => orderApi.adminHistory(orderId),
    select: (rows) => rows.map(toOrderHistory),
  })
}
