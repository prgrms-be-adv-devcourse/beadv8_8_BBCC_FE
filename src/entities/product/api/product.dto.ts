// 상품 API는 백엔드에 아직 없다(목 응답). 모양은 기획서 8장 product.changed data + 1.5(옵션 = 색상 × 소재 × 사이즈)

export type ProductOptionDto = {
  optionId: string
  color: string
  material: string
  size: string
  price: number
  stock: number
  minHeightCm: number
  maxHeightCm: number
  soldOut: boolean
}

/** GET /products 한 줄 */
export type ProductSummaryDto = {
  productId: string
  name: string
  categoryId: string
  categoryName: string
  sellerId: string
  sellerName: string
  status: string
  minPrice: number
  thumbnailUrl: string | null
}

/** GET /products/{productId} · GET /seller/products 한 줄 */
export type ProductDetailDto = ProductSummaryDto & {
  description: string
  options: ProductOptionDto[]
}

/** POST /seller/products */
export type RegisterProductRequestDto = {
  name: string
  categoryId: string
  description: string
  options: Omit<ProductOptionDto, 'optionId' | 'soldOut'>[]
}

/** PATCH /seller/products/{productId} (기획서 8장 보완) */
export type UpdateProductRequestDto = {
  name: string
  categoryId: string
  description: string
  options: { optionId: string; price: number }[]
}

/** PATCH /seller/products/{productId}/options/{optionId}/stock — 증감 수량과 사유 */
export type AdjustStockRequestDto = { delta: number; reason: string }

/** GET /products 검색 조건 (빈 값은 보내지 않음) */
export type ProductSearchParamsDto = { keyword?: string; categoryId?: string }
