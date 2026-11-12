import { num, obj, oneOf, str } from '@/shared/api'

export const adminShape = obj({
  id: num,
  email: str,
  status: oneOf(['ACTIVE', 'DISABLED']),
  createdAt: str,
})
