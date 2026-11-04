import { num, obj, str } from '@/shared/api'
export const childAccountShape = obj({ id: num, childProfileId: num, loginId: str })
