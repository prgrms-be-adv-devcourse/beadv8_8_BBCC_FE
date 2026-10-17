export type ProductStatus = 'SALE_PENDING' | 'ON_SALE' | 'STOPPED'

export type StockStatus = 'AVAILABLE' | 'LOW' | 'SOLD_OUT'

/** 구매자가 고르는 옵션 (BE 상세 options) */
export type ProductOption = {
  id: string
  /** 예: "네이비 / 120" */
  name: string
  /** 사이즈 항목의 값. 사이즈가 없는 상품이면 null */
  size: string | null
  price: number
  /** 살 수 없음(판매 상태 · 재고 0) */
  soldOut: boolean
  stockStatus: StockStatus
  /** 남은 수량. 적을 때(LOW)만 있다 */
  stockQuantity: number | null
  /** 이 사이즈의 권장 키 범위 (cm). 없으면 null */
  minHeightCm: number | null
  maxHeightCm: number | null
}

/** 상품 목록 카드 (BE GET /products) */
export type ProductListItem = {
  id: string
  name: string
  /** 대표 이미지. 없으면 null → 기본 이미지 */
  imageUrl: string | null
  /** 판매자 상호명. 없으면 null */
  businessName: string | null
  minPrice: number
  soldOut: boolean
  sizeFree: boolean
}

export type ProductSummary = {
  id: string
  name: string
  brand: string | null
  categoryId: string
  /** /categories 트리에서 찾은 이름. 못 찾으면 빈 문자열 */
  categoryName: string
  status: ProductStatus
  /** 옵션이 없으면 null */
  minPrice: number | null
  /** 대표 이미지 (S3). 없으면 null → 기본 이미지 */
  imageUrl: string | null
}

/** 사이즈별 실측 · 권장 키 */
export type SizeSpec = {
  size: string
  minHeightCm: number | null
  maxHeightCm: number | null
  measurements: { name: string; unit: string; value: number | null }[]
}

export type ProductDetail = ProductSummary & {
  imageUrls: string[]
  sizeFree: boolean
  options: ProductOption[]
  /** 상품 정보 항목 (예: 주요소재). 입력하지 않았으면 value null */
  info: { name: string; value: string | null }[]
  sizeSpecs: SizeSpec[]
}

/** (목) 판매자 상품 목록 한 줄. 재고는 모르면 null */
/** 내 상품 목록 한 줄 (요약) */
export type SellerProduct = {
  id: string
  name: string
  status: ProductStatus
  imageUrl: string | null
  optionCount: number
  totalStock: number
  minPrice: number | null
  createdAt: string
}

/** 내 상품 하나: 옵션별 재고 + 수정 폼을 채울 저장 값 (수정 요청과 같은 모양) */
export type SellerProductDetail = {
  id: string
  name: string
  status: ProductStatus
  /** 읽어 간 버전. 수정할 때 그대로 보낸다 */
  version: number
  brand: string | null
  categoryId: string
  description: string | null
  /** 저장된 순서, 첫 번째가 대표 */
  imageUrls: string[]
  /** 정보 항목 ID → 고른 값 ID들(목록 항목) · 직접 입력 값 */
  attributes: { attributeId: string; valueIds: string[]; text: string | null }[]
  options: {
    id: string
    name: string
    valueIds: string[]
    price: number
    stock: number
    onSale: boolean
  }[]
  prices: { valueIds: string[]; price: number }[]
  sizeSpecs: {
    sizeValueId: string
    minHeightCm: number | null
    maxHeightCm: number | null
    measurements: Record<string, number>
  }[]
}

export const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = {
  SALE_PENDING: '판매 시작 전',
  ON_SALE: '판매 중',
  STOPPED: '판매 중지',
}

/** 고를 수 있는 카테고리 (트리의 끝). path = "상위 > 하위" */
export type Category = { id: string; name: string; path: string }

/** 등록 폼 항목 하나 (BE CategoryInputsResponse.InputAttribute) */
export type InputAttribute = {
  id: string
  code: string
  name: string
  inputType: string
  required: boolean
  sizeRole: boolean
  priceAffecting: boolean
  /** 직접 입력 항목이면 빈 목록 */
  values: { id: string; name: string; colorCode: string | null }[]
}

/** 카테고리에 맞는 등록 폼 구성 */
export type CategoryInputs = {
  categoryId: string
  categoryName: string
  /** 옵션 항목 (예: 색상 · 사이즈). 고른 값의 모든 조합이 옵션이 된다 */
  optionAttributes: InputAttribute[]
  /** 정보 항목 (예: 주요소재 · 혼용률) */
  infoAttributes: InputAttribute[]
  /** 사이즈마다 넣을 실측 항목 */
  measurementItems: { code: string; name: string; unit: string }[]
}

/** 사이즈 하나의 권장 키 · 실측 입력 */
export type SizeSpecInput = {
  minHeightCm: number
  maxHeightCm: number
  /** 실측 항목 코드 → cm */
  measurements: Record<string, number>
}

/** 상품 등록 폼 값 */
export type RegisterProductForm = {
  name: string
  brand: string
  /** 올린 이미지 주소 (S3). 첫 번째가 대표 이미지 */
  imageUrls: string[]
  categoryId: string
  /** 정보 항목 ID → 고른 값 ID(목록 항목) 또는 직접 입력 값 */
  info: Record<string, { valueId: string; text: string }>
  /** 옵션 항목 ID → 고른 값 ID들 */
  optionValues: Record<string, string[]>
  /** 옵션 조합 키 → 처음 재고 */
  stocks: Record<string, number>
  /** 가격 묶음 키 → 판매가 */
  prices: Record<string, number>
  /** 사이즈 값 ID → 권장 키 · 실측 */
  sizeSpecs: Record<string, SizeSpecInput>
}

/** 옵션 조합 · 가격 묶음 한 줄 (폼이 고른 값에서 계산) */
export type ValueCombo = { key: string; valueIds: string[]; label: string }

/** 사진 입력 칸(업로드 기능)에 넘기는 값. 업로드는 다른 기능이라 페이지가 등록 · 수정 폼에 슬롯으로 끼워 넣는다 */
export type ProductImagesField = {
  /** 올린 이미지 주소 (첫 번째가 대표) */
  value: string[]
  onChange: (imageUrls: string[]) => void
  /** 올리는 중에는 저장 버튼을 막는다 */
  onUploadingChange: (isUploading: boolean) => void
}

/** (목) 상품 수정 폼: 상품명 · 옵션별 가격 (재고는 재고 조정으로) */
export type ProductEditForm = {
  name: string
  /** optionId → 가격 */
  prices: Record<string, number>
}

/** 재고 조정 사유 (BE InventoryAdjustmentReason에서 처음 재고 INITIAL 제외) */
export type StockReason = 'RESTOCK' | 'DEFECTIVE' | 'LOST' | 'CORRECTION'

export const STOCK_REASON_LABEL: Record<StockReason, string> = {
  RESTOCK: '입고',
  DEFECTIVE: '불량',
  LOST: '분실',
  CORRECTION: '정정',
}

export type ProductSort = 'NEWEST' | 'PRICE_ASC' | 'PRICE_DESC'

export const PRODUCT_SORT_LABEL: Record<ProductSort, string> = {
  NEWEST: '최신순',
  PRICE_ASC: '낮은 가격순',
  PRICE_DESC: '높은 가격순',
}

export type ProductSearch = {
  keyword: string
  categoryId: string | null
  /** 없으면 최신순 */
  sort?: ProductSort
  /** 고른 옵션 값 "항목코드:값ID" (예: COLOR:3). 같은 항목 안은 하나만 맞아도, 다른 항목끼리는 모두 맞아야 나온다 */
  attributes?: string[]
}
