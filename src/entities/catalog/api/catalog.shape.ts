import { obj, str } from '@/shared/api'

export const measurementItemShape = obj({ measurementItemId: str, name: str, code: str, unit: str })
