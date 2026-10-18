export { catalogApi } from './api/catalog-api'
/** 목 응답 작성 전용 (app/mocks) */
export type {
  CategoryDto,
  AttributeDto,
  CategoryCreateRequestDto,
  MeasurementItemDto,
  ProductTypeDto,
} from './api/catalog.dto'
export {
  ATTRIBUTE_INPUT_TYPE_LABEL,
  ATTRIBUTE_ROLE_LABEL,
  type Attribute,
  type AttributeForm,
  type AttributeInputType,
  type AttributeRole,
  type AttributeValue,
  type AttributeValueForm,
  type CatalogCategory,
  type CategoryForm,
  type CategoryKind,
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
export { toCatalogCategory, toCategoryCreateRequest } from './model/category.mapper'
export {
  categoryPath,
  categoryTree,
  parentCandidates,
  validateCategoryForm,
  type CategoryTreeRow,
} from './model/category.rules'
export { toProductType, toProductTypeCreateRequest } from './model/product-type.mapper'
export { canBeOption, validateProductTypeForm } from './model/product-type.rules'
export {
  catalogKeys,
  useAttributesQuery,
  useCatalogCategoriesQuery,
  useMeasurementItemsQuery,
  useProductTypesQuery,
} from './model/queries'
