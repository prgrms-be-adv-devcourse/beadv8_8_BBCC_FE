import { arr, nullable, obj, oneOf, str } from '@/shared/api'

export const attributeValueShape = obj({ valueId: str, name: str, colorCode: nullable(str) })

export const attributeShape = obj({
  attributeId: str,
  name: str,
  code: str,
  inputType: oneOf(['PALETTE', 'LIST', 'MULTI_LIST', 'TEXT']),
  values: arr(attributeValueShape),
})

export const measurementItemShape = obj({ measurementItemId: str, name: str, code: str, unit: str })
