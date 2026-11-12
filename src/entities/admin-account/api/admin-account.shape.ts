import { num, obj, oneOf, pageOf, str } from '@/shared/api'

export const adminShape = obj({
  id: num,
  email: str,
  status: oneOf(['ACTIVE', 'DISABLED']),
  createdAt: str,
})

export const adminPageShape = pageOf(adminShape)
