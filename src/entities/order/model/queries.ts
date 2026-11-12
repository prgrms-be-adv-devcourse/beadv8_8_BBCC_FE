import { useQuery } from '@tanstack/react-query'
import { deliveryTrackingApi } from '../api/delivery-tracking-api'
import { orderApi } from '../api/order-api'
import { toDeliveryTracking } from './delivery-tracking.mapper'
import { toAdminOrder, toOrder, toOrderSummary } from './order.mapper'
import { toChildPurchase } from './child-purchase'
import { toOrderHistory } from './order-history'
import { toOrderTimeline } from './order-timeline'
import { isAwaitingPayment, paymentPollInterval } from './order.rules'

export const orderKeys = {
  list: ['orders', 'list'] as const,
  detail: (orderId: string) => ['orders', 'detail', orderId] as const,
  timeline: (orderId: string, revision: string) =>
    ['orders', 'timeline', orderId, revision] as const,
  childPurchases: (page: number) => ['orders', 'child-purchases', page] as const,
  adminHistory: (orderId: string) => ['orders', 'admin-history', orderId] as const,
  tracking: (orderId: string, deliveryId: string) =>
    ['orders', 'tracking', orderId, deliveryId] as const,
}

export function useOrdersQuery() {
  return useQuery({
    queryKey: orderKeys.list,
    queryFn: orderApi.list,
    select: (page) => ({ ...page, content: page.content.map(toOrderSummary) }),
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

export function useAdminOrdersQuery(status: string | null) {
  return useQuery({
    queryKey: ['orders', 'admin'] as const,
    queryFn: () => orderApi.adminList(),
    // BE는 상태로 거르지 않는다 (최근 100건 안에서 화면이 거른다)
    select: (page) => ({
      ...page,
      content: page.content
        .map(toAdminOrder)
        .filter((order) => status === null || order.status === status),
    }),
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

/**
 * 배송 하나의 택배 진행 이력 (BE #1320). 「배송 조회」를 눌렀을 때만 부른다.
 * 실패는 자동으로 다시 부르지 않는다 (503은 화면의 다시 시도 버튼, 외부 호출 한도를 아낀다)
 */
export function useDeliveryTrackingQuery(
  orderId: string,
  deliveryId: string,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: orderKeys.tracking(orderId, deliveryId),
    queryFn: () => deliveryTrackingApi.get(orderId, deliveryId),
    select: toDeliveryTracking,
    enabled: options.enabled ?? true,
    retry: false,
    staleTime: 60_000,
  })
}
