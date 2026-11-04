import { wishRequestShape } from '@/entities/wish'
import { apiClient, expectShape } from '@/shared/api'
import type {
  ApproveWishRequestDto,
  RejectWishRequestDto,
  WishDecisionResponseDto,
} from './decision.dto'

export const decideWishApi = {
  approve: (id: string, request: ApproveWishRequestDto) =>
    apiClient
      .post<WishDecisionResponseDto>(`/wish/requests/${id}/approval`, request)
      .then(expectShape(wishRequestShape))
      .then((result) => result.orderId),
  reject: (id: string, request: RejectWishRequestDto) =>
    apiClient
      .post<WishDecisionResponseDto>(`/wish/requests/${id}/rejection`, request)
      .then(expectShape(wishRequestShape))
      .then(() => undefined),
}
