// 상품 기준 데이터: 판매자가 상품을 등록할 때 고르는 항목 · 목록 값 · 실측 항목 (관리자가 만든다)

/** 판매자가 항목 값을 넣는 방식. 직접 입력(TEXT)만 글자로 적고 나머지는 목록 값에서 고른다 */
export type AttributeInputType = 'PALETTE' | 'LIST' | 'MULTI_LIST' | 'TEXT'

export const ATTRIBUTE_INPUT_TYPE_LABEL: Record<AttributeInputType, string> = {
  PALETTE: '색 팔레트',
  LIST: '목록 (하나 고름)',
  MULTI_LIST: '목록 (여러 개 고름)',
  TEXT: '직접 입력',
}

export type AttributeValue = { id: string; name: string; colorCode: string | null }

export type Attribute = {
  id: string
  name: string
  code: string
  inputType: AttributeInputType
  values: AttributeValue[]
}

export type MeasurementItem = { id: string; name: string; code: string; unit: string }

/** 입력 중인 목록 값. 색 코드는 팔레트 항목에서만 쓴다 */
export type AttributeValueForm = { name: string; colorCode: string }

export type AttributeForm = {
  name: string
  code: string
  inputType: AttributeInputType
  values: AttributeValueForm[]
}

export type MeasurementItemForm = { name: string; code: string; unit: string }
