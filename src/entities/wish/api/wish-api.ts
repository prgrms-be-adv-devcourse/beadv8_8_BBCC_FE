import { apiClient, expectShape } from '@/shared/api'
import type { WishDto, WishRequestDto, WishTimelineDto } from './wish.dto'
import { wishRequestShape, wishRequestsShape, wishShape, wishTimelineShape } from './wish.shape'

export const wishApi = {
  get: (childId: string) =>
    apiClient.get<WishDto>('/wish', { params: { childId } }).then(expectShape(wishShape)),
  requests: (childId: string) =>
    apiClient
      .get<WishRequestDto[]>('/wish/requests', { params: { childId } })
      .then(expectShape(wishRequestsShape)),
  request: (id: string) =>
    apiClient.get<WishRequestDto>(`/wish/requests/${id}`).then(expectShape(wishRequestShape)),
  timeline: (id: string) =>
    apiClient
      .get<WishTimelineDto>(`/wish/requests/${id}/timeline`)
      .then(expectShape(wishTimelineShape)),
}
