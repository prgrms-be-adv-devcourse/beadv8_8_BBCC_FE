import { apiClient, expectShape, type Page } from '@/shared/api'
import type {
  AdjustStockRequestDto,
  CategoryTreeDto,
  ProductDetailDto,
  ProductSearchParamsDto,
  ProductSummaryDto,
  RegisterProductRequestDto,
  UpdateProductRequestDto,
} from './product.dto'
import {
  categoryTreeShape,
  productDetailPageShape,
  productDetailShape,
  productPageShape,
} from './product.shape'

// 상품 API는 백엔드에 아직 없다 (모두 목 응답). 경로는 기획서 8장 상품 표

export const productApi = {
  /** 카테고리 트리 (BE에 있음. 상품 목이 켜져 있으면 목 카테고리) */
  categories: () =>
    apiClient.get<CategoryTreeDto[]>('/categories').then(expectShape(categoryTreeShape)),
  /** 판매 중인 상품. 검색어 · 카테고리로 거른다 */
  list: (search: ProductSearchParamsDto = {}) =>
    apiClient
      .get<Page<ProductSummaryDto>>('/products', { params: { ...search, page: 0, size: 20 } })
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
  /** 바뀌면 product.changed로 추천 · 주문 복사본이 갱신된다 */
  update: (productId: string, request: UpdateProductRequestDto) =>
    apiClient
      .patch<ProductDetailDto>(`/seller/products/${productId}`, request)
      .then(expectShape(productDetailShape)),
  stopSale: (productId: string) => apiClient.post(`/seller/products/${productId}/stop-sale`),
  adjustStock: (productId: string, optionId: string, request: AdjustStockRequestDto) =>
    apiClient
      .patch<ProductDetailDto>(`/seller/products/${productId}/options/${optionId}/stock`, request)
      .then(expectShape(productDetailShape)),
  /** 관리자: 정책 위반 상품 판매 중지 (사유 필수) */
  adminStopSale: (productId: string, request: { reason: string }) =>
    apiClient.post(`/admin/products/${productId}/stop-sale`, request),
}
