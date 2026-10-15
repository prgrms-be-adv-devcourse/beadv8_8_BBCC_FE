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

/** (목) GET /seller/products 한 줄. 재고는 등록 응답 수량 + 목 조정 (모르면 null) */
export type SellerProductDto = ProductSummaryDto & {
  options: { optionId: string; optionName: string; price: number; stock: number | null }[]
}

/** (목) PATCH /seller/products/{productId} (기획서 8장 보완) */
export type UpdateProductRequestDto = {
  name: string
  options: { optionId: string; price: number }[]
}

/** (목) PATCH /seller/products/{productId}/options/{optionId}/stock — 증감 수량과 사유 */
export type AdjustStockRequestDto = { delta: number; reason: string }

/** (목) GET /products 검색 조건 (빈 값은 보내지 않음) */
/** GET /products 쿼리 (BE ProductListRequest). sort · attributes는 아직 안 씀 */
export type ProductSearchParamsDto = {
  keyword?: string
  categoryId?: string
  sort?: string
  /** "항목코드:값ID" 목록, 20개까지 */
  attributes?: string[]
}
