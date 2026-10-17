import { apiClient, expectShape, type Page } from '@/shared/api'
import type {
  CategoryInputsDto,
  CategoryTreeDto,
  ProductDetailDto,
  ProductListItemDto,
  ProductSearchParamsDto,
  RegisterProductRequestDto,
  RegisterProductResultDto,
  SaleStatusResultDto,
  InventoryAdjustmentRequestDto,
  ProductUpdateRequestDto,
  InventoryAdjustmentResultDto,
  SellerProductDetailDto,
  SellerProductSummaryDto,
} from './product.dto'
import {
  categoryInputsShape,
  categoryTreeShape,
  productDetailShape,
  productListPageShape,
  registerProductResultShape,
  saleStatusResultShape,
  inventoryAdjustmentResultShape,
  sellerProductDetailShape,
  sellerProductSummaryPageShape,
} from './product.shape'

// 실제: 카테고리 · 입력 항목 · 목록 · 상세 · 등록 · 판매 시작 · 판매자 목록 · 상세 · 재고 조정 · 판매 중지(판매자 · 관리자). 목: 수정

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
      .get<Page<ProductListItemDto>>('/products', {
        params: { ...search, page: 0, size: 20 },
        // 목록은 attributes=COLOR:3&attributes=SIZE:5 (Spring List 바인딩, 대괄호 없이)
        paramsSerializer: { indexes: null },
      })
      .then(expectShape(productListPageShape)),
  /** 판매 시작 전 상품은 404 */
  get: (productId: string) =>
    apiClient.get<ProductDetailDto>(`/products/${productId}`).then(expectShape(productDetailShape)),
  /** 내 상품 요약 (등록 최신순) */
  sellerList: () =>
    apiClient
      .get<Page<SellerProductSummaryDto>>('/seller/products', { params: { page: 0, size: 50 } })
      .then(expectShape(sellerProductSummaryPageShape)),
  /** 내 상품 하나 (옵션별 가격 · 판매 가능 수량) */
  sellerGet: (productId: string) =>
    apiClient
      .get<SellerProductDetailDto>(`/seller/products/${productId}`)
      .then(expectShape(sellerProductDetailShape)),
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
  /**
   * 상품 수정 (BE #317 PUT, 상세 응답은 #403). 읽어 간 version이 다르면 409.
   * 판매 시작 뒤에 옵션 · 가격 · 실측을 보내면 409. 응답은 수정된 판매자 상세
   */
  updateProduct: (productId: string, request: ProductUpdateRequestDto) =>
    apiClient
      .put<SellerProductDetailDto>(`/seller/products/${productId}`, request)
      .then(expectShape(sellerProductDetailShape)),
  /** 판매 중지 (BE #315). 다시 판매는 startSale */
  stopSale: (productId: string) =>
    apiClient
      .put<SaleStatusResultDto>(`/seller/products/${productId}/sale-status`, { status: 'STOPPED' })
      .then(expectShape(saleStatusResultShape)),
  /** 재고 조정 (BE SellerInventoryController): 증감량 + 사유 */
  adjustStock: (optionId: string, request: InventoryAdjustmentRequestDto) =>
    apiClient
      .post<InventoryAdjustmentResultDto>(
        `/seller/options/${optionId}/inventory-adjustments`,
        request,
      )
      .then(expectShape(inventoryAdjustmentResultShape)),
  /** 관리자: 정책 위반 상품 판매 중지 (BE #315, 사유는 받지 않음). 판매자는 다시 판매할 수 없다 */
  adminStopSale: (productId: string) =>
    apiClient
      .put<SaleStatusResultDto>(`/admin/products/${productId}/sale-status`, { status: 'STOPPED' })
      .then(expectShape(saleStatusResultShape)),
}
