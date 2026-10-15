export type ProductStatus = 'SALE_PENDING' | 'ON_SALE' | 'STOPPED'

export type ProductOption = {
  id: string
  color: string
  material: string
  size: string
  price: number
  stock: number
  /** 이 사이즈의 권장 키 범위 (cm) */
  minHeightCm: number
  maxHeightCm: number
  soldOut: boolean
}

export type ProductSummary = {
  id: string
  name: string
  categoryId: string
  categoryName: string
  sellerName: string
  status: ProductStatus
  minPrice: number
  /** 대표 이미지 (S3). 없으면 null → 기본 이미지 */
  imageUrl: string | null
}

export type ProductDetail = ProductSummary & {
  description: string
  options: ProductOption[]
}

/** 상품 등록 폼 값: 색상 · 소재 하나 + 사이즈 줄 여러 개 */
export type ProductSizeRow = {
  size: string
  minHeightCm: number
  maxHeightCm: number
  price: number
  stock: number
}

export type RegisterProductForm = {
  name: string
  categoryId: string
  color: string
  material: string
  sizes: ProductSizeRow[]
}

export const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = {
  SALE_PENDING: '판매 시작 전',
  ON_SALE: '판매 중',
  STOPPED: '판매 중지',
}

export const CATEGORIES = [
  { id: '1', name: '상의' },
  { id: '2', name: '하의' },
  { id: '3', name: '원피스' },
  { id: '4', name: '아우터' },
]

/** 상품 수정 폼: 상품명 · 카테고리 · 설명 · 옵션별 가격 (재고는 재고 조정으로) */
export type ProductEditForm = {
  name: string
  categoryId: string
  description: string
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

export type ProductSearch = { keyword: string; categoryId: string | null }
