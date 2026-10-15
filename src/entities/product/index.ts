export { productApi } from './api/product-api'
/** 목 응답 작성 전용 (app/mocks) */
export type {
  ProductDetailDto,
  ProductOptionDto,
  ProductSummaryDto,
  RegisterProductRequestDto,
  UpdateProductRequestDto,
} from './api/product.dto'
export {
  CATEGORIES,
  PRODUCT_STATUS_LABEL,
  STOCK_REASON_LABEL,
  type ProductDetail,
  type ProductEditForm,
  type ProductOption,
  type ProductSearch,
  type ProductSizeRow,
  type ProductStatus,
  type ProductSummary,
  type RegisterProductForm,
  type StockReason,
} from './model/product'
export {
  toProductDetail,
  toProductEditForm,
  toProductSearchParams,
  toProductSummary,
  toRegisterProductRequest,
  toUpdateProductRequest,
} from './model/product.mapper'
export {
  canStartSale,
  canStopSale,
  describeSizes,
  findOption,
  isOnSale,
  validateProductEditForm,
  validateRegisterProductForm,
  validateStockAdjustment,
} from './model/product.rules'
export {
  productKeys,
  useProductQuery,
  useProductsQuery,
  useSellerProductsQuery,
} from './model/queries'
export { ProductCard } from './ui/ProductCard'
export { ProductImage } from './ui/ProductImage'
export { ProductOptionList } from './ui/ProductOptionList'
