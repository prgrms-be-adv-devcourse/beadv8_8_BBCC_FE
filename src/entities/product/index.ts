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
  type CategoryGroup,
  type CategoryInputs,
  type InputAttribute,
  type ProductDetail,
  type ProductImagesField,
  type ProductListItem,
  type ProductOption,
  type OptionChip,
  type OptionChipRow,
  type OptionPicks,
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
  toCategoryGroups,
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
  detailImagesOf,
  galleryIndexOf,
  canStopSale,
  categoryNameOf,
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
  useCategoryGroupsQuery,
  useCategoryInputsQuery,
  useProductQuery,
  useProductsQuery,
  useSellerProductQuery,
  useSellerProductsQuery,
} from './model/queries'
export { ProductCard } from './ui/ProductCard'
export { ProductDescription } from './ui/ProductDescription'
export { ProductGallery } from './ui/ProductGallery'
export { ProductImage } from './ui/ProductImage'
export { OptionChipPicker } from './ui/OptionChipPicker'
export { ProductFormFields } from './ui/ProductFormFields'
export { ProductSpecs } from './ui/ProductSpecs'
export { garmentKindOf, wearFitOf, type WearFit } from './model/wear-preview'
export { WearPreview } from './ui/WearPreview'
export {
  readProductFilters,
  writeProductFilters,
  type ProductFilters,
} from './model/product-filter-params'
export {
  DETAIL_IMAGE_MAX_COUNT,
  productImageFields,
  useImageUploading,
} from './model/product-images'
export {
  isChipPickable,
  missingPickMessage,
  optionChipRows,
  pickedOption,
  pickOptionValue,
} from './model/option-picker.rules'
export { ALL_CATEGORIES_ICON } from './config/category-icons'
export { categoryIconOf } from './model/category-icon.rules'
export { CategoryIcon } from './ui/CategoryIcon'
