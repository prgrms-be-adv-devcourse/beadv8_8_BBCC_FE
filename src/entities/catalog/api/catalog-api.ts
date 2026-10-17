import { apiClient, arr, expectShape } from '@/shared/api'
import type {
  AttributeCreateRequestDto,
  AttributeDto,
  AttributeValueDto,
  AttributeValueRequestDto,
  MeasurementItemDto,
  MeasurementItemRequestDto,
} from './catalog.dto'
import { attributeShape, attributeValueShape, measurementItemShape } from './catalog.shape'

// 실제(BE #405, ADMIN만): 항목 · 목록 값 · 실측 항목 만들기와 목록. 목록은 페이지 없이 ID 순서

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
}
