import { arr, nullable, num, obj, oneOf, str } from '@/shared/api'

export const tokenShape = obj({ accessToken: str })

export const memberShape = obj({
  id: num,
  nickname: str,
  email: nullable(str),
  roles: arr(oneOf(['BUYER', 'SELLER', 'ADMIN'])),
  sellerStatus: nullable(oneOf(['ACTIVE', 'SUSPENDED'])),
  providers: arr(str),
})
