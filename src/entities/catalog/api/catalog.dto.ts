// BE 관리자 기준 데이터 API (#405, ADMIN만) 요청 · 응답 그대로. ID는 모두 문자열

/** AttributeResponse.Value. colorCode는 팔레트 값이 아니면 null */
export type AttributeValueDto = { valueId: string; name: string; colorCode: string | null }

/** AttributeResponse. inputType은 PALETTE · LIST · MULTI_LIST · TEXT */
export type AttributeDto = {
  attributeId: string
  name: string
  code: string
  inputType: string
  values: AttributeValueDto[]
}

/** AttributeValueRequest. colorCode는 팔레트 값일 때만, 아니면 null */
export type AttributeValueRequestDto = { name: string; colorCode: string | null }

/** AttributeCreateRequest. values는 없으면 빈 목록 (null이면 400) */
export type AttributeCreateRequestDto = {
  name: string
  code: string
  inputType: string
  values: AttributeValueRequestDto[]
}

/** MeasurementItemResponse */
export type MeasurementItemDto = {
  measurementItemId: string
  name: string
  code: string
  unit: string
}

/** MeasurementItemRequest */
export type MeasurementItemRequestDto = { name: string; code: string; unit: string }

// 상품 유형 (BE #424 ProductTypeCreateRequest · ProductTypeResponse)

/** ProductTypeCreateRequest.Link. boolean 네 칸은 빠지면 400이라 늘 보낸다. 모든 값 허용이면 allowedValueIds는 [] (null이면 400) */
export type ProductTypeLinkRequestDto = {
  attributeId: string
  role: string
  required: boolean
  allValuesAllowed: boolean
  sizeRole: boolean
  priceAffecting: boolean
  allowedValueIds: string[]
}

/** ProductTypeCreateRequest. 넣은 순서가 연결 순서 */
export type ProductTypeCreateRequestDto = { name: string; attributes: ProductTypeLinkRequestDto[] }

/** ProductTypeResponse.Link. role은 OPTION · INFO, 모든 값 허용이면 allowedValues는 [] */
export type ProductTypeLinkDto = {
  attributeId: string
  code: string
  name: string
  inputType: string
  role: string
  required: boolean
  allValuesAllowed: boolean
  sizeRole: boolean
  priceAffecting: boolean
  allowedValues: AttributeValueDto[]
}

/** ProductTypeResponse */
export type ProductTypeDto = {
  productTypeId: string
  name: string
  attributes: ProductTypeLinkDto[]
}
