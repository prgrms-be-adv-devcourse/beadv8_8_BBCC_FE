import type { MockHandler } from '@/shared/api'
import { now } from './mock-utils'

// 충전 취소는 기획서 ④(과제 필수)에 있지만 백엔드에 아직 없다. 실제 잔액은 바꾸지 못하므로 응답만 돌려준다
export const paymentHandlers: MockHandler[] = [
  {
    method: 'POST',
    path: '/wallets/me/charges/:chargeId/cancel',
    handle: ({ params }) => ({
      status: 200,
      data: { chargeId: Number(params.chargeId), status: 'CANCELLED', cancelledAt: now() },
    }),
  },
]
