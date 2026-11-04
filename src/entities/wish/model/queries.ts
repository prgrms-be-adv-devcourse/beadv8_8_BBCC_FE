import { useQuery } from '@tanstack/react-query'
import { childWishApi, wishApi } from '../api/wish-api'
import { toWish, toWishRequest, toWishTimeline } from './wish.mapper'

export const wishKeys = {
  child: ['child-wish'] as const,
  requests: (childId: string) => ['wish', 'requests', childId] as const,
  request: (id: string) => ['wish', 'request', id] as const,
  timeline: (id: string) => ['wish', 'timeline', id] as const,
}
export function useChildWishQuery() {
  return useQuery({
    queryKey: wishKeys.child,
    queryFn: childWishApi.get,
    select: toWish,
    gcTime: 0,
    staleTime: 0,
  })
}
export function useWishRequestsQuery(childId: string) {
  return useQuery({
    queryKey: wishKeys.requests(childId),
    queryFn: () => wishApi.requests(childId),
    select: (items) => items.map(toWishRequest),
    enabled: !!childId,
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
