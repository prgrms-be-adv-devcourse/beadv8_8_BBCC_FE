import { apiClient, expectShape, type Page } from '@/shared/api'
import type { ProductDetailDto, ProductSummaryDto, RegisterProductRequestDto } from './product.dto'
import { productDetailPageShape, productDetailShape, productPageShape } from './product.shape'

export const productApi = {
  list: () =>
    apiClient
      .get<Page<ProductSummaryDto>>('/products', { params: { page: 0, size: 20 } })
      .then(expectShape(productPageShape)),
  get: (productId: string) =>
    apiClient.get<ProductDetailDto>(`/products/${productId}`).then(expectShape(productDetailShape)),
  sellerList: () =>
    apiClient
      .get<Page<ProductDetailDto>>('/seller/products', { params: { page: 0, size: 20 } })
      .then(expectShape(productDetailPageShape)),
  register: (request: RegisterProductRequestDto) =>
    apiClient
      .post<ProductDetailDto>('/seller/products', request)
      .then(expectShape(productDetailShape)),
  startSale: (productId: string) => apiClient.post(`/seller/products/${productId}/start-sale`),
}
