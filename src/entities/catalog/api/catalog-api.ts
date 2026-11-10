import { apiClient, arr, expectShape } from '@/shared/api'
import type {
  CategoryDto,
  AttributeCreateRequestDto,
  AttributeDto,
  AttributeValueDto,
  AttributeValueRequestDto,
  CategoryChangeRequestDto,
  CategoryCreateRequestDto,
  MeasurementItemDto,
  MeasurementItemRequestDto,
  ProductTypeChangeRequestDto,
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
  /**
   * 유형 연결 바꾸기 (이름은 그대로). 연결 목록 전체로 통째로 바꾼다. 유형 규칙에 어긋나면 400,
   * 상품이 있는 유형에서 허용되지 않는 변경이면 409. 응답은 목록의 유형 하나와 같은 모양
   */
  changeProductType: (productTypeId: string, request: ProductTypeChangeRequestDto) =>
    apiClient
      .put<ProductTypeDto>(`/admin/product-types/${productTypeId}`, request)
      .then(expectShape(productTypeShape)),
  /** 카테고리 목록. ID 순서의 평면 배열이고 계층은 parentId (트리는 화면에서 만든다) */
  categories: () =>
    apiClient.get<CategoryDto[]>('/admin/categories').then(expectShape(arr(categoryShape))),
  /** 카테고리 만들기. 말단 아래 · 중간에 실측 항목이면 400, 없는 부모 · 유형 · 실측 항목은 404, 같은 위치 같은 이름은 409 */
  createCategory: (request: CategoryCreateRequestDto) =>
    apiClient.post<CategoryDto>('/admin/categories', request).then(expectShape(categoryShape)),
  /**
   * 말단 카테고리의 상품 유형 · 필수 실측 항목 바꾸기 (이름 · 부모는 그대로). 중간 카테고리 · 지운 기준 데이터면 400,
   * 상품이 있는 카테고리에서 실측 항목 빼기 · 순서 변경이 아니면 409
   */
  changeCategory: (categoryId: string, request: CategoryChangeRequestDto) =>
    apiClient
      .put<CategoryDto>(`/admin/categories/${categoryId}`, request)
      .then(expectShape(categoryShape)),
  // 지우기: 모두 204이고 BE는 소프트 삭제라 목록에서만 빠진다. 다른 기준 데이터가 쓰고 있으면 409, 없으면 404
  /** 상품 유형에 연결된 항목이면 409 */
  deleteAttribute: (attributeId: string) =>
    apiClient.delete<void>(`/admin/attributes/${attributeId}`).then(() => undefined),
  /** 목록 값은 막는 경우가 없다. 다른 항목의 값이면 404 */
  deleteAttributeValue: (attributeId: string, valueId: string) =>
    apiClient
      .delete<void>(`/admin/attributes/${attributeId}/values/${valueId}`)
      .then(() => undefined),
  /** 카테고리가 필수로 연결한 실측 항목이면 409 */
  deleteMeasurementItem: (measurementItemId: string) =>
    apiClient.delete<void>(`/admin/measurement-items/${measurementItemId}`).then(() => undefined),
  /** 카테고리가 가리키는 유형이면 409 */
  deleteProductType: (productTypeId: string) =>
    apiClient.delete<void>(`/admin/product-types/${productTypeId}`).then(() => undefined),
  /** 하위 카테고리가 있으면 409 */
  deleteCategory: (categoryId: string) =>
    apiClient.delete<void>(`/admin/categories/${categoryId}`).then(() => undefined),
}
