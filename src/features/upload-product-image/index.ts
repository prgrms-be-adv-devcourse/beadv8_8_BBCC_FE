/** 단위 테스트 입력용 (tests/unit) */
export type { ProductImageUploadUrlsDto } from './api/product-image.dto'
export { productImageUploadUrlsShape } from './api/product-image.shape'
export {
  toUploadTargets,
  toUploadUrlsRequest,
  type UploadTarget,
} from './model/product-image.mapper'
export {
  canUploadImageSize,
  canUploadImageType,
  isUploadUrlExpired,
  validateImageCount,
} from './model/product-image.rules'
export { useUploadProductImage } from './model/use-upload-product-image'
export { ProductImageUploader } from './ui/ProductImageUploader'
