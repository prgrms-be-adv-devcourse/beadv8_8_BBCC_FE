import { bool, nullable, num, obj, str } from '@/shared/api'

export const addressShape = obj({
  id: num,
  recipientName: str,
  recipientPhone: str,
  zipCode: str,
  roadAddress: str,
  detailAddress: nullable(str),
  isDefault: bool,
})
