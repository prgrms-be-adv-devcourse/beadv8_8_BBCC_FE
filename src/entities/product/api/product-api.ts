import { apiClient, expectShape, type Page } from '@/shared/api'
import type {
  AdjustStockRequestDto,
  CategoryInputsDto,
  CategoryTreeDto,
  ProductDetailDto,
  ProductListItemDto,
  ProductSearchParamsDto,
  RegisterProductRequestDto,
  RegisterProductResultDto,
  SaleStatusResultDto,
  SellerProductDto,
  UpdateProductRequestDto,
} from './product.dto'
import {
  categoryInputsShape,
  categoryTreeShape,
  productDetailShape,
  productListPageShape,
  registerProductResultShape,
  saleStatusResultShape,
  sellerProductPageShape,
} from './product.shape'

// 실제: 카테고리 · 입력 항목 · 목록 · 상세 · 등록 · 판매 시작. 목: 판매자 목록 · 수정 · 판매 중지 · 재고 조정

export const productApi = {
  categories: () =>
    apiClient.get<CategoryTreeDto[]>('/categories').then(expectShape(categoryTreeShape)),
  /** 카테고리에 맞는 등록 폼 항목 (옵션 · 정보 항목과 고를 값, 실측 항목) */
  categoryInputs: (categoryId: string) =>
    apiClient
      .get<CategoryInputsDto>(`/categories/${categoryId}/attributes`)
      .then(expectShape(categoryInputsShape)),
  /** 판매 중인 상품 (품절 포함, 최신순). 검색어 · 카테고리로 거른다. 로그인 없이 된다 */
  list: (search: ProductSearchParamsDto = {}) =>
    apiClient
      .get<Page<ProductListItemDto>>('/products', { params: { ...search, page: 0, size: 20 } })
      .then(expectShape(productListPageShape)),
  /** 판매 시작 전 상품은 404 */
  get: (productId: string) =>
    apiClient.get<ProductDetailDto>(`/products/${productId}`).then(expectShape(productDetailShape)),
  /** (목) 내 상품 */
  sellerList: () =>
    apiClient
      .get<Page<SellerProductDto>>('/seller/products', { params: { page: 0, size: 20 } })
      .then(expectShape(sellerProductPageShape)),
  /** 판매 시작 전(SALE_PENDING)으로 등록된다 */
  register: (request: RegisterProductRequestDto) =>
    apiClient
      .post<RegisterProductResultDto>('/seller/products', request)
      .then(expectShape(registerProductResultShape)),
  /** 판매 시작. 이미 판매 중이면 그대로 200. 처음 시작하면 product.changed → 추천 · 주문 복사본 */
  startSale: (productId: string) =>
    apiClient
      .put<SaleStatusResultDto>(`/seller/products/${productId}/sale-status`, { status: 'ON_SALE' })
      .then(expectShape(saleStatusResultShape)),
  /** (목) 상품명 · 옵션 가격 수정 */
  update: (productId: string, request: UpdateProductRequestDto) =>
    apiClient.patch(`/seller/products/${productId}`, request),
  /** (목) */
  stopSale: (productId: string) => apiClient.post(`/seller/products/${productId}/stop-sale`),
  /** (목) */
  adjustStock: (productId: string, optionId: string, request: AdjustStockRequestDto) =>
    apiClient.patch(`/seller/products/${productId}/options/${optionId}/stock`, request),
  /** (목) 관리자: 정책 위반 상품 판매 중지 (사유 필수) */
  adminStopSale: (productId: string, request: { reason: string }) =>
    apiClient.post(`/admin/products/${productId}/stop-sale`, request),
}
