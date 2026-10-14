import { apiClient, type Page } from '@/shared/api'
import type { ProductDetailDto, ProductSummaryDto, RegisterProductRequestDto } from './product.dto'

export const productApi = {
  list: () =>
    apiClient
      .get<Page<ProductSummaryDto>>('/products', { params: { page: 0, size: 20 } })
      .then((response) => response.data),
  get: (productId: string) =>
    apiClient.get<ProductDetailDto>(`/products/${productId}`).then((response) => response.data),
  sellerList: () =>
    apiClient
      .get<Page<ProductDetailDto>>('/seller/products', { params: { page: 0, size: 20 } })
      .then((response) => response.data),
  register: (request: RegisterProductRequestDto) =>
    apiClient.post<ProductDetailDto>('/seller/products', request).then((response) => response.data),
  startSale: (productId: string) => apiClient.post(`/seller/products/${productId}/start-sale`),
}
