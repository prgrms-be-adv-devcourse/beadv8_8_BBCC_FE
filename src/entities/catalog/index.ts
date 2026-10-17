export { catalogApi } from './api/catalog-api'
/** 목 응답 작성 전용 (app/mocks) */
export type { AttributeDto, MeasurementItemDto } from './api/catalog.dto'
export {
  ATTRIBUTE_INPUT_TYPE_LABEL,
  type Attribute,
  type AttributeForm,
  type AttributeInputType,
  type AttributeValue,
  type AttributeValueForm,
  type MeasurementItem,
  type MeasurementItemForm,
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
export { catalogKeys, useAttributesQuery, useMeasurementItemsQuery } from './model/queries'
