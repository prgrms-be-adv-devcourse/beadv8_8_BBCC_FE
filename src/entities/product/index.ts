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
  ProductUpdateRequestDto,
} from './api/product.dto'
export {
  PRODUCT_STATUS_LABEL,
  STOCK_REASON_LABEL,
  type Category,
  type CategoryInputs,
  type InputAttribute,
  type ProductDetail,
  type ProductImagesField,
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
  toProductSearchParams,
  toProductListItem,
  toProductSummary,
  toRegisterProductRequest,
} from './model/product.mapper'
export {
  existingComboStocks,
  toEditableProductForm,
  toProductUpdateRequest,
} from './model/product-edit.mapper'
export {
  canEditSaleInputs,
  canStartSale,
  canStopSale,
  categoryNameOf,
  findOption,
  isFreeSize,
  isOnSale,
  filterSellerProducts,
  LOW_STOCK_THRESHOLD,
  stockLevelOf,
  type StockLevel,
  optionCombos,
  priceGroups,
  listItemMeta,
  productMeta,
  sizeValues,
  validateProductUpdateForm,
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
export { ProductFormFields } from './ui/ProductFormFields'
export { ProductSpecs } from './ui/ProductSpecs'
export { garmentKindOf, wearFitOf, type WearFit } from './model/wear-preview'
export { WearPreview } from './ui/WearPreview'
export {
  readProductFilters,
  writeProductFilters,
  type ProductFilters,
} from './model/product-filter-params'
