export { productApi } from './api/product-api'
/** 단위 테스트 입력용 (tests/unit) */
export type {
  CategoryInputsDto,
  CategoryTreeDto,
  ProductDetailDto,
  ProductSummaryDto,
} from './api/product.dto'
export {
  PRODUCT_STATUS_LABEL,
  STOCK_REASON_LABEL,
  type Category,
  type CategoryGender,
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
  productImageUrlOf,
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
  canChangeProduct,
  canDelist,
  productIdFromInput,
  canStartSale,
  detailImagesOf,
  galleryIndexOf,
  canStopSale,
  categoryNameOf,
  isFreeSize,
  isOnSale,
  optionCombos,
  priceGroups,
  registerPreviewOf,
  type RegisterPreview,
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
  useProductImageUrls,
  useProductQuery,
  useProductsQuery,
  useSellerProductQuery,
  useSellerProductCountQuery,
  useSellerProductsQuery,
} from './model/queries'
export { ProductCard } from './ui/ProductCard'
export { ProductDescription } from './ui/ProductDescription'
export { ProductGallery } from './ui/ProductGallery'
export { ProductImage } from './ui/ProductImage'
export { OptionChipPicker } from './ui/OptionChipPicker'
export { ProductFormFields } from './ui/ProductFormFields'
export { ProductSellerLine } from './ui/ProductSellerLine'
export { ProductSpecs } from './ui/ProductSpecs'
export { ProductTile } from './ui/ProductTile'
export {
  productListTitle,
  effectiveSort,
  readProductFilters,
  sortOptionsFor,
  readProductPage,
  writeProductFilters,
  writeProductPage,
  type ProductFilters,
} from './model/product-filter-params'
export {
  DETAIL_IMAGE_MAX_COUNT,
  productImageFields,
  useImageUploading,
} from './model/product-images'
export {
  chipNoteOf,
  isChipPickable,
  missingPickMessage,
  optionChipRows,
  pickedOption,
  pickOptionValue,
  picksOfOption,
} from './model/option-picker.rules'
export { ALL_CATEGORIES_ICON } from './config/category-icons'
export { categoryIconOf } from './model/category-icon.rules'
export { visibleCategoryIdOf } from './model/visible-category.rules'
export { CategoryIcon } from './ui/CategoryIcon'
export { HOME_HERO_PHOTO } from './config/sample-photos'
export {
  optionStockStateOf,
  sellerProductStockTagsOf,
  summarizeOptionStock,
  type OptionStockState,
  type StockTag,
} from './model/seller-stock.rules'
export {
  SELLER_PRODUCT_TABS,
  sellerProductTabOf,
  toSellerProductsParams,
  toSellerProductTabSearch,
  type SellerProductTab,
} from './model/seller-product-tab.rules'
