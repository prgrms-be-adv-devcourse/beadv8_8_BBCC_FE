import { useQuery } from '@tanstack/react-query'
import { childWishApi, wishApi } from '../api/wish-api'
import { toWishRequest, toWishTimeline } from './wish.mapper'

export const wishKeys = {
  childRequests: ['child-wish-requests'] as const,
  requests: (childId: string) => ['wish', 'requests', childId] as const,
  /** 내 자녀 모두에게서 받은 조르기 (보호자 마이페이지 「받은 조르기」 · 메뉴 건수) */
  allRequests: ['wish', 'requests', 'all'] as const,
  request: (id: string) => ['wish', 'request', id] as const,
  timeline: (id: string) => ['wish', 'timeline', id] as const,
}
export function useWishRequestsQuery(childId: string) {
  return useQuery({
    queryKey: wishKeys.requests(childId),
    queryFn: () => wishApi.requests(childId),
    select: (items) => items.map(toWishRequest),
    enabled: !!childId,
  })
}
/** 보호자: 내 자녀 모두에게서 받은 조르기 (최근 것부터, BE 순서) */
export function useAllWishRequestsQuery({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: wishKeys.allRequests,
    queryFn: () => wishApi.requests(),
    select: (items) => items.map(toWishRequest),
    enabled,
  })
}
export function useWishRequestQuery(id: string) {
  return useQuery({
    queryKey: wishKeys.request(id),
    queryFn: () => wishApi.request(id),
    select: toWishRequest,
    enabled: !!id,
  })
}
export function useWishTimelineQuery(id: string) {
  return useQuery({
    queryKey: wishKeys.timeline(id),
    queryFn: () => wishApi.timeline(id),
    select: toWishTimeline,
    enabled: !!id,
  })
}

/** 자녀 토큰으로 내가 보낸 조르기 */
export function useChildWishRequestsQuery() {
  return useQuery({
    queryKey: wishKeys.childRequests,
    queryFn: childWishApi.requests,
    select: (items) => items.map(toWishRequest),
    gcTime: 0,
    staleTime: 0,
  })
}
