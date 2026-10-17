import { arr, bool, nullable, obj, oneOf, str } from '@/shared/api'

export const attributeValueShape = obj({ valueId: str, name: str, colorCode: nullable(str) })

export const attributeShape = obj({
  attributeId: str,
  name: str,
  code: str,
  inputType: oneOf(['PALETTE', 'LIST', 'MULTI_LIST', 'TEXT']),
  values: arr(attributeValueShape),
})

export const productTypeShape = obj({
  productTypeId: str,
  name: str,
  attributes: arr(
    obj({
      attributeId: str,
      code: str,
      name: str,
      inputType: oneOf(['PALETTE', 'LIST', 'MULTI_LIST', 'TEXT']),
      role: oneOf(['OPTION', 'INFO']),
      required: bool,
      allValuesAllowed: bool,
      sizeRole: bool,
      priceAffecting: bool,
      allowedValues: arr(attributeValueShape),
    }),
  ),
})

export const measurementItemShape = obj({ measurementItemId: str, name: str, code: str, unit: str })

export const categoryShape = obj({
  categoryId: str,
  name: str,
  parentId: nullable(str),
  leaf: bool,
  productTypeId: nullable(str),
  productTypeName: nullable(str),
  measurementItems: arr(measurementItemShape),
})
