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
  categoryName: string
  sellerName: string
  status: ProductStatus
  minPrice: number
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
