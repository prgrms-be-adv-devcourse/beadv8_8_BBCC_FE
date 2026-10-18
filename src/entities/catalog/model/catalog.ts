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

/** 상품 유형에서 항목의 역할: 옵션(재고 · 가격 단위) · 정보(상세에 보여 줌) */
export type AttributeRole = 'OPTION' | 'INFO'

export const ATTRIBUTE_ROLE_LABEL: Record<AttributeRole, string> = {
  OPTION: '옵션',
  INFO: '정보',
}

/** 상품 유형이 항목 하나를 쓰는 설정. 모든 값 허용이 아니면 allowedValues만 고를 수 있다 */
export type ProductTypeLink = {
  attributeId: string
  code: string
  name: string
  inputType: AttributeInputType
  role: AttributeRole
  required: boolean
  allValuesAllowed: boolean
  sizeRole: boolean
  priceAffecting: boolean
  allowedValues: AttributeValue[]
}

export type ProductType = { id: string; name: string; links: ProductTypeLink[] }

export type ProductTypeLinkForm = {
  attributeId: string
  role: AttributeRole
  required: boolean
  allValuesAllowed: boolean
  sizeRole: boolean
  priceAffecting: boolean
  allowedValueIds: string[]
}

export type ProductTypeForm = { name: string; links: ProductTypeLinkForm[] }

/** 관리자 카테고리. 말단만 상품 유형과 필수 실측 항목을 가진다 */
export type CatalogCategory = {
  id: string
  name: string
  parentId: string | null
  isLeaf: boolean
  productTypeId: string | null
  productTypeName: string | null
  measurementItems: MeasurementItem[]
}

/** 중간(아래에 카테고리를 둠) · 말단(상품을 등록함) */
export type CategoryKind = 'MIDDLE' | 'LEAF'

/** parentId · productTypeId는 고르지 않았으면 '' (최상위 · 유형 없음) */
export type CategoryForm = {
  name: string
  parentId: string
  kind: CategoryKind
  productTypeId: string
  measurementItemIds: string[]
}
