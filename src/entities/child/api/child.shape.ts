import { nullable, num, obj, oneOf, str } from '@/shared/api'

export const childShape = obj({
  id: num,
  name: str,
  birthDate: str,
  gender: oneOf(['MALE', 'FEMALE']),
  heightCm: num,
  weightKg: num,
  bodyType: nullable(oneOf(['SLIM', 'NORMAL', 'CHUNKY'])),
  preferredFit: nullable(oneOf(['SLIM', 'REGULAR', 'LOOSE'])),
  growthRecordCount: num,
  lastRecordedAt: nullable(str),
})
