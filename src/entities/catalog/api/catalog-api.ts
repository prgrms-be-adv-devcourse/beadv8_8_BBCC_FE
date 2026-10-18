import { apiClient, arr, expectShape } from '@/shared/api'
import type {
  CategoryDto,
  AttributeCreateRequestDto,
  AttributeDto,
  AttributeValueDto,
  AttributeValueRequestDto,
  CategoryCreateRequestDto,
  MeasurementItemDto,
  MeasurementItemRequestDto,
  ProductTypeCreateRequestDto,
  ProductTypeDto,
} from './catalog.dto'
import {
  categoryShape,
  attributeShape,
  attributeValueShape,
  measurementItemShape,
  productTypeShape,
} from './catalog.shape'

// 실제(ADMIN만): 항목 · 목록 값 · 실측 항목(BE #405), 상품 유형(BE #424) · 카테고리(BE #425) 만들기와 목록.
// 목록은 페이지 없이 ID 순서

export const catalogApi = {
  attributes: () =>
    apiClient.get<AttributeDto[]>('/admin/attributes').then(expectShape(arr(attributeShape))),
  /** 코드가 겹치면 409 */
  createAttribute: (request: AttributeCreateRequestDto) =>
    apiClient.post<AttributeDto>('/admin/attributes', request).then(expectShape(attributeShape)),
  /** 없는 항목이면 404, 같은 항목에 같은 이름이 있으면 409 */
  addAttributeValue: (attributeId: string, request: AttributeValueRequestDto) =>
    apiClient
      .post<AttributeValueDto>(`/admin/attributes/${attributeId}/values`, request)
      .then(expectShape(attributeValueShape)),
  measurementItems: () =>
    apiClient
      .get<MeasurementItemDto[]>('/admin/measurement-items')
      .then(expectShape(arr(measurementItemShape))),
  /** 코드가 겹치면 409 */
  createMeasurementItem: (request: MeasurementItemRequestDto) =>
    apiClient
      .post<MeasurementItemDto>('/admin/measurement-items', request)
      .then(expectShape(measurementItemShape)),
  /** 유형 목록. 연결 순서대로 항목 설정을 담는다 */
  productTypes: () =>
    apiClient
      .get<ProductTypeDto[]>('/admin/product-types')
      .then(expectShape(arr(productTypeShape))),
  /** 유형 만들기. 유형 규칙에 어긋나면 400, 없는 항목 · 값은 404, 이름이 겹치거나 같은 항목을 두 번 연결하면 409 */
  createProductType: (request: ProductTypeCreateRequestDto) =>
    apiClient
      .post<ProductTypeDto>('/admin/product-types', request)
      .then(expectShape(productTypeShape)),
  /** 카테고리 목록. ID 순서의 평면 배열이고 계층은 parentId (트리는 화면에서 만든다) */
  categories: () =>
    apiClient.get<CategoryDto[]>('/admin/categories').then(expectShape(arr(categoryShape))),
  /** 카테고리 만들기. 말단 아래 · 중간에 실측 항목이면 400, 없는 부모 · 유형 · 실측 항목은 404, 같은 위치 같은 이름은 409 */
  createCategory: (request: CategoryCreateRequestDto) =>
    apiClient.post<CategoryDto>('/admin/categories', request).then(expectShape(categoryShape)),
}
