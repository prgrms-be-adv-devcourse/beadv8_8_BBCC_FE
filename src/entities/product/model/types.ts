// 상품 API는 백엔드에 아직 없다(목 응답). 모양은 기획서 8장 product.changed data와 노션 명세 v2를 따른다
export type ProductStatus = 'SALE_PENDING' | 'ON_SALE' | 'STOPPED'

export type ProductOption = {
  optionId: string
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

/** GET /products 목록 한 줄 */
export type ProductSummary = {
  productId: string
  name: string
  categoryId: string
  categoryName: string
  sellerId: string
  sellerName: string
  status: ProductStatus
  minPrice: number
  thumbnailUrl: string | null
}

/** GET /products/{productId} */
export type ProductDetail = ProductSummary & {
  description: string
  options: ProductOption[]
}

export const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = {
  SALE_PENDING: '판매 시작 전',
  ON_SALE: '판매 중',
  STOPPED: '판매 중지',
}

export const CATEGORIES = [
  { categoryId: '1', name: '상의' },
  { categoryId: '2', name: '하의' },
  { categoryId: '3', name: '원피스' },
  { categoryId: '4', name: '아우터' },
]
