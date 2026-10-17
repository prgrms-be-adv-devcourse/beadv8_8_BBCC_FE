// 실제 API: 상세 · 등록 · 판매 시작 · 카테고리 · 카테고리 입력 항목 (BE in/** record 그대로)
// 실제 API: 상품 목록 GET /products (BE #288 · #291)
// 목: 판매자 상품 목록 · 수정 · 재고 조정 · 판매 중지 (모양은 FE가 정함)

/** GET /products/{productId} (BE ProductDetailResponse). 판매 시작 전 상품은 404 */
export type ProductDetailDto = {
  productId: string
  name: string
  brand: string | null
  categoryId: string
  status: string
  sizeFree: boolean
  /** 옵션이 없으면 null */
  minPrice: number | null
  imageUrls: string[]
  optionAttributes: {
    attributeId: string
    code: string
    name: string
    values: { valueId: string; value: string; colorCode: string | null }[]
  }[]
  options: {
    optionId: string
    optionName: string
    valueIds: string[]
    price: number
    purchasable: boolean
    /** AVAILABLE · LOW · SOLD_OUT */
    stockStatus: string
    /** LOW일 때만 값이 있다 */
    stockQuantity: number | null
  }[]
  productInfo: { code: string; name: string; value: string | null }[]
  sizeSpecs: {
    size: string
    minHeightCm: number | null
    maxHeightCm: number | null
    /** 실측 항목 코드 → cm */
    measurements: Record<string, number>
  }[]
  measurementItems: { code: string; name: string; unit: string }[]
}

/** POST /seller/products (BE ProductRegisterRequest). ID는 문자열로 보내도 BE가 숫자로 받는다 */
export type RegisterProductRequestDto = {
  name: string
  brand: string | null
  categoryId: number
  description: string | null
  thumbnailUrl: string | null
  imageUrls: string[]
  // ID는 숫자로 보낸다 (BE ProductRegisterRequest가 Long으로 받음). 화면 상태값은 문자열 그대로
  attributes: { attributeId: number; valueIds: number[]; text: string | null }[]
  options: { valueIds: number[]; initialQuantity: number; skuCode: string | null }[]
  prices: { valueIds: number[]; price: number }[]
  sizeSpecs: {
    sizeValueId: number
    minHeightCm: number | null
    maxHeightCm: number | null
    measurements: Record<string, number>
  }[]
}

/**
 * PUT /seller/products/{productId} (BE ProductUpdateRequest). 읽어 간 version을 함께 보낸다.
 * options · prices · sizeSpecs는 판매 시작 전에만 셋을 함께 보내고, 그 밖에는 셋 다 null (보내면 409)
 */
export type ProductUpdateRequestDto = Omit<
  RegisterProductRequestDto,
  'options' | 'prices' | 'sizeSpecs'
> & {
  version: number
  options: RegisterProductRequestDto['options'] | null
  prices: RegisterProductRequestDto['prices'] | null
  sizeSpecs: RegisterProductRequestDto['sizeSpecs'] | null
}

/** POST /seller/products → 201 (BE ProductRegisterResponse, Location에도 productId) */
export type RegisterProductResultDto = {
  productId: string
  status: string
  version: number
  options: {
    optionId: string
    optionName: string
    price: number
    availableQuantity: number
    saleStatus: string
    skuCode: string | null
  }[]
}

/** PUT /seller/products/{productId}/sale-status (BE ProductSaleStatusResponse) */
export type SaleStatusResultDto = { productId: string; status: string; version: number }

/** GET /categories (BE CategoryTreeResponse). leaf = 더 나뉘지 않는 카테고리 */
export type CategoryTreeDto = {
  categoryId: string
  name: string
  leaf: boolean
  children: CategoryTreeDto[]
}

/** GET /categories/{categoryId}/attributes (BE CategoryInputsResponse) */
export type CategoryInputsDto = {
  categoryId: string
  categoryName: string
  productTypeId: string
  productTypeName: string
  attributes: {
    attributeId: string
    code: string
    name: string
    /** 예: PALETTE · LIST · TEXT */
    inputType: string
    /** OPTION · INFO */
    role: string
    required: boolean
    sizeRole: boolean
    priceAffecting: boolean
    /** 직접 입력 항목이면 빈 목록 */
    values: { valueId: string; value: string; colorCode: string | null }[]
  }[]
  measurementItems: { code: string; name: string; unit: string }[]
}

/** GET /products 한 줄 (BE ProductListItemResponse). 판매 중 상품만, 품절도 남는다 */
export type ProductListItemDto = {
  productId: string
  name: string
  /** 없으면 null */
  thumbnailUrl: string | null
  /** 판매자 상호명. 없으면 null */
  businessName: string | null
  minPrice: number
  soldOut: boolean
  sizeFree: boolean
}

/** (목) 판매자 상품 목록 · 목 상품 저장소 한 줄 */
export type ProductSummaryDto = {
  productId: string
  name: string
  brand: string | null
  categoryId: string
  status: string
  minPrice: number | null
  thumbnailUrl: string | null
}

/** GET /seller/products 한 줄 (BE SellerProductSummaryResponse). 등록 최신순 */
export type SellerProductSummaryDto = {
  productId: string
  name: string
  thumbnailUrl: string | null
  status: string
  optionCount: number
  totalAvailableQuantity: number
  /** 옵션이 없으면 null */
  minPrice: number | null
  createdAt: string
}

/**
 * GET /seller/products/{productId} · PUT 수정 응답 (BE SellerProductDetailResponse, #403).
 * 칸 이름 · 모양은 수정 요청(ProductUpdateRequest)과 같아 그대로 다시 보낼 수 있다
 */
export type SellerProductDetailDto = {
  productId: string
  name: string
  status: string
  version: number
  brand: string | null
  categoryId: string
  description: string | null
  thumbnailUrl: string | null
  /** 저장된 순서. 없으면 [] */
  imageUrls: string[]
  /** 정보 항목마다 한 칸. 목록 항목은 고른 값들, 직접 입력 항목은 valueIds [] + text */
  attributes: { attributeId: string; valueIds: string[]; text: string | null }[]
  options: {
    optionId: string
    optionName: string
    valueIds: string[]
    price: number
    availableQuantity: number
    saleStatus: string
    skuCode: string | null
  }[]
  /** 가격 구분 묶음마다 하나 (가격 구분 항목이 없으면 valueIds [] 하나) */
  prices: { valueIds: string[]; price: number }[]
  sizeSpecs: {
    sizeValueId: string
    minHeightCm: number | null
    maxHeightCm: number | null
    measurements: Record<string, number>
  }[]
}

/** POST /seller/options/{optionId}/inventory-adjustments. 늘리면 양수, 줄이면 음수 */
export type InventoryAdjustmentRequestDto = { deltaQuantity: number; reason: string }
export type InventoryAdjustmentResultDto = {
  optionId: string
  reason: string
  deltaQuantity: number
  availableQuantity: number
}

/** (목) PATCH /seller/products/{productId}/options/{optionId}/stock — 증감 수량과 사유 */

/** (목) GET /products 검색 조건 (빈 값은 보내지 않음) */
/** GET /products 쿼리 (BE ProductListRequest). sort · attributes는 아직 안 씀 */
export type ProductSearchParamsDto = {
  keyword?: string
  categoryId?: string
  sort?: string
  /** "항목코드:값ID" 목록, 20개까지 */
  attributes?: string[]
}
