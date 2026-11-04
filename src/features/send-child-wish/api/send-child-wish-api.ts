import { wishRequestShape } from '@/entities/wish'
import { apiClient, expectShape } from '@/shared/api'
import type { SendChildWishRequestDto } from './send-child-wish.dto'

export function sendChildWish(body: SendChildWishRequestDto) {
  return apiClient.post('/child/wish/requests', body).then(expectShape(wishRequestShape))
}
