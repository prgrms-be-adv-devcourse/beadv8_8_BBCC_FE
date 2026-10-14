export { productApi } from './api/product-api'
/** 목 응답 작성 전용 (app/mocks) */
export type {
  ProductDetailDto,
  ProductOptionDto,
  ProductSummaryDto,
  RegisterProductRequestDto,
} from './api/product.dto'
export {
  CATEGORIES,
  PRODUCT_STATUS_LABEL,
  type ProductDetail,
  type ProductOption,
  type ProductSizeRow,
  type ProductStatus,
  type ProductSummary,
  type RegisterProductForm,
} from './model/product'
export { toRegisterProductRequest } from './model/product.mapper'
export {
  canStartSale,
  describeSizes,
  findOption,
  isOnSale,
  validateRegisterProductForm,
} from './model/product.rules'
export {
  productKeys,
  useProductQuery,
  useProductsQuery,
  useSellerProductsQuery,
} from './model/queries'
export { ProductCard } from './ui/ProductCard'
export { ProductOptionList } from './ui/ProductOptionList'
