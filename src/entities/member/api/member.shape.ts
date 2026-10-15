import { nullable, num, obj, oneOf, pageOf, str } from '@/shared/api'

export const adminMemberPageShape = pageOf(
  obj({
    id: num,
    nickname: str,
    email: nullable(str),
    status: oneOf(['ACTIVE', 'SUSPENDED']),
    sellerStatus: nullable(oneOf(['ACTIVE', 'SUSPENDED'])),
    suspendReason: nullable(str),
    suspendedAt: nullable(str),
    createdAt: str,
  }),
)
