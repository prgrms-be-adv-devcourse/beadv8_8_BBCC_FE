import { apiClient, arr, expectShape } from '@/shared/api'
import type { MeasurementItemDto, MeasurementItemRequestDto } from './catalog.dto'
import { measurementItemShape } from './catalog.shape'

// 실제(BE #405, ADMIN만): 실측 항목 만들기와 목록. 목록은 페이지 없이 ID 순서

export const catalogApi = {
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
