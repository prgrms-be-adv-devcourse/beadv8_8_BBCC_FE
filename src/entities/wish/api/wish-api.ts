import { apiClient, expectShape } from '@/shared/api'
import type { WishRequestDto, WishTimelineDto } from './wish.dto'
import { wishRequestShape, wishRequestsShape, wishTimelineShape } from './wish.shape'

/**
 * 조르기 (BE #999 `/api/v1/wish/requests`). 회원(보호자)과 자녀 토큰을 함께 받는다:
 * 각자 볼 수 있는 것(보낸 것 + 승인자인 것)만 온다
 */
export const wishApi = {
  /** @param childId 받는 자녀로 거른다. 없으면 내 자녀 모두 */
  requests: (childId?: string) =>
    apiClient
      .get<WishRequestDto[]>('/wish/requests', { params: childId ? { childId } : {} })
      .then(expectShape(wishRequestsShape)),
  request: (id: string) =>
    apiClient.get<WishRequestDto>(`/wish/requests/${id}`).then(expectShape(wishRequestShape)),
  timeline: (id: string) =>
    apiClient
      .get<WishTimelineDto>(`/wish/requests/${id}/timeline`)
      .then(expectShape(wishTimelineShape)),
}

/** 로그인한 자녀가 보낸 조르기 (같은 경로, 자녀 토큰) */
export const childWishApi = {
  requests: () =>
    apiClient
      .get<WishRequestDto[]>('/wish/requests', { principal: 'child' })
      .then(expectShape(wishRequestsShape)),
}
