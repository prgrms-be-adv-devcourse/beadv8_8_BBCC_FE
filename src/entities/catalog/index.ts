export { catalogApi } from './api/catalog-api'
/** 목 응답 작성 전용 (app/mocks) */
export type { AttributeDto, MeasurementItemDto, ProductTypeDto } from './api/catalog.dto'
export {
  ATTRIBUTE_INPUT_TYPE_LABEL,
  ATTRIBUTE_ROLE_LABEL,
  type Attribute,
  type AttributeForm,
  type AttributeInputType,
  type AttributeRole,
  type AttributeValue,
  type AttributeValueForm,
  type MeasurementItem,
  type MeasurementItemForm,
  type ProductType,
  type ProductTypeForm,
  type ProductTypeLink,
  type ProductTypeLinkForm,
} from './model/catalog'
export {
  toAttribute,
  toAttributeCreateRequest,
  toAttributeValueRequest,
  toMeasurementItem,
  toMeasurementItemRequest,
} from './model/catalog.mapper'
export {
  hasValueList,
  needsColorCode,
  validateAttributeForm,
  validateAttributeValueForm,
  validateMeasurementItemForm,
} from './model/catalog.rules'
export { toProductType, toProductTypeCreateRequest } from './model/product-type.mapper'
export { canBeOption, validateProductTypeForm } from './model/product-type.rules'
export {
  catalogKeys,
  useAttributesQuery,
  useMeasurementItemsQuery,
  useProductTypesQuery,
} from './model/queries'
