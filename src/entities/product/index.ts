export { productApi } from './api/product-api'
/** 목 응답 작성 전용 (app/mocks) */
export type {
  CategoryInputsDto,
  CategoryTreeDto,
  ProductDetailDto,
  ProductSummaryDto,
  RegisterProductRequestDto,
  RegisterProductResultDto,
  SaleStatusResultDto,
  UpdateProductRequestDto,
} from './api/product.dto'
export {
  PRODUCT_STATUS_LABEL,
  STOCK_REASON_LABEL,
  type Category,
  type CategoryInputs,
  type InputAttribute,
  type ProductDetail,
  type ProductEditForm,
  type ProductListItem,
  type ProductOption,
  PRODUCT_SORT_LABEL,
  type ProductSearch,
  type ProductSort,
  type ProductStatus,
  type ProductSummary,
  type RegisterProductForm,
  type SellerProduct,
  type SellerProductDetail,
  type SizeSpec,
  type SizeSpecInput,
  type StockReason,
  type ValueCombo,
} from './model/product'
export {
  toCategories,
  toCategoryInputs,
  toProductDetail,
  toProductEditForm,
  toProductSearchParams,
  toProductListItem,
  toProductSummary,
  toRegisterProductRequest,
  toUpdateProductRequest,
} from './model/product.mapper'
export {
  canStartSale,
  canStopSale,
  categoryNameOf,
  findOption,
  isFreeSize,
  isOnSale,
  optionCombos,
  priceGroups,
  listItemMeta,
  productMeta,
  sizeValues,
  validateProductEditForm,
  validateRegisterProductForm,
  validateStockAdjustment,
} from './model/product.rules'
export {
  productKeys,
  useCategoriesQuery,
  useCategoryInputsQuery,
  useProductQuery,
  useProductsQuery,
  useSellerProductQuery,
  useSellerProductsQuery,
} from './model/queries'
export { ProductCard } from './ui/ProductCard'
export { ProductImage } from './ui/ProductImage'
export { ProductOptionList } from './ui/ProductOptionList'
export { ProductSpecs } from './ui/ProductSpecs'
export { garmentKindOf, wearFitOf, type WearFit } from './model/wear-preview'
export { WearPreview } from './ui/WearPreview'
export {
  readProductFilters,
  writeProductFilters,
  type ProductFilters,
} from './model/product-filter-params'
