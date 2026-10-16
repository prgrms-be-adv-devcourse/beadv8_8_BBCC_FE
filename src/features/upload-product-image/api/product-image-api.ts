import { apiClient, expectShape } from '@/shared/api'
import type {
  ProductImageUploadUrlsDto,
  ProductImageUploadUrlsRequestDto,
} from './product-image.dto'
import { productImageUploadUrlsShape } from './product-image.shape'

export const productImageApi = {
  /** 업로드 주소 발급 (판매자). 형식 · 크기 위반은 400 */
  issueUploadUrls: (request: ProductImageUploadUrlsRequestDto) =>
    apiClient
      .post<ProductImageUploadUrlsDto>('/seller/product-images/upload-urls', request)
      .then(expectShape(productImageUploadUrlsShape)),
}
