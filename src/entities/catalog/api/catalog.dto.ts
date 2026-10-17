// BE 관리자 기준 데이터 API (#405, ADMIN만) 요청 · 응답 그대로. ID는 모두 문자열

/** MeasurementItemResponse */
export type MeasurementItemDto = {
  measurementItemId: string
  name: string
  code: string
  unit: string
}

/** MeasurementItemRequest */
export type MeasurementItemRequestDto = { name: string; code: string; unit: string }
