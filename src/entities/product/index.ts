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
  SellerProductDto,
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
  type ProductSearch,
  type ProductStatus,
  type ProductSummary,
  type RegisterProductForm,
  type SellerProduct,
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
  useSellerProductsQuery,
} from './model/queries'
export { ProductCard } from './ui/ProductCard'
export { ProductImage } from './ui/ProductImage'
export { ProductOptionList } from './ui/ProductOptionList'
export { ProductSpecs } from './ui/ProductSpecs'
