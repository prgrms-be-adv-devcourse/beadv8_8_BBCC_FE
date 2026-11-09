import { wishRequestShape } from '@/entities/wish'
import { apiClient, expectShape } from '@/shared/api'
import type { SendChildWishRequestDto } from './send-child-wish.dto'

/** 201 + 조르기. 고른 칸이 승인자(보호자) 앞으로 예약된다. 자녀만 보낸다(자녀 토큰) */
export function sendChildWish(body: SendChildWishRequestDto) {
  return apiClient
    .post('/wish/requests', body, { principal: 'child' })
    .then(expectShape(wishRequestShape))
}
