import type { SellerProductsParamsDto } from '../api/product.dto'

/** 판매자 상품 목록 탭 */
export type SellerProductTab = 'ALL' | 'ON_SALE' | 'STOPPED' | 'LOW_STOCK'

export const SELLER_PRODUCT_TABS: { tab: SellerProductTab; label: string }[] = [
  { tab: 'ALL', label: '전체' },
  { tab: 'ON_SALE', label: '판매 중' },
  { tab: 'STOPPED', label: '판매 중지' },
  { tab: 'LOW_STOCK', label: '재고 적음' },
]

/**
 * 탭 → 요청 값. 재고 적음은 판매 중 상품 가운데 품절 · 재고 적은 옵션이 있는 것
 * (BE의 lowStock은 상태를 거르지 않아 ON_SALE을 함께 보낸다)
 */
export function toSellerProductsParams(
  tab: SellerProductTab,
  page: number,
  size: number,
): SellerProductsParamsDto {
  if (tab === 'ON_SALE' || tab === 'STOPPED') return { status: tab, page, size }
  if (tab === 'LOW_STOCK') return { status: 'ON_SALE', lowStock: true, page, size }
  return { page, size }
}

/** 주소(?status= · ?stock=low) → 탭. 없거나 모르는 값은 전체 */
export function sellerProductTabOf(search: {
  status: string | null
  stock: string | null
}): SellerProductTab {
  if (search.stock === 'low') return 'LOW_STOCK'
  if (search.status === 'ON_SALE' || search.status === 'STOPPED') return search.status
  return 'ALL'
}

/** 탭 → 주소에 남길 값 (판매자 홈 숫자 링크 · 탭 이동) */
export function toSellerProductTabSearch(tab: SellerProductTab): {
  status?: string
  stock?: string
} {
  if (tab === 'LOW_STOCK') return { stock: 'low' }
  if (tab === 'ALL') return {}
  return { status: tab }
}
