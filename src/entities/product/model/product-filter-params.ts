import { PRODUCT_SORT_LABEL, type ProductSearch, type ProductSort } from './product'

/** 홈 상품 거르기 (검색어 제외). 주소에 저장해 뒤로 가기 · 링크 공유에도 유지한다 */
export type ProductFilters = Omit<ProductSearch, 'keyword'>

const isSort = (value: string | null): value is ProductSort =>
  value !== null && value in PRODUCT_SORT_LABEL

/** 주소 → 거르기. ?cat=11&sort=PRICE_ASC&attr=COLOR:3&attr=SIZE:7 (모르는 정렬은 버린다) */
export function readProductFilters(params: URLSearchParams): ProductFilters {
  const sort = params.get('sort')
  const attributes = params.getAll('attr').filter((value) => /^[^:]+:[^:]+$/.test(value))
  return {
    categoryId: params.get('cat') || null,
    ...(isSort(sort) && sort !== 'NEWEST' ? { sort } : {}),
    ...(attributes.length > 0 ? { attributes } : {}),
  }
}

/** 거르기 → 주소. 다른 값(검색어 q · 자녀 child)은 그대로 두고, 기본값(최신순 · 빈 값)은 싣지 않는다 */
export function writeProductFilters(
  params: URLSearchParams,
  filters: ProductFilters,
): URLSearchParams {
  const next = new URLSearchParams(params)
  for (const key of ['cat', 'sort', 'attr']) next.delete(key)
  if (filters.categoryId) next.set('cat', filters.categoryId)
  if (filters.sort && filters.sort !== 'NEWEST') next.set('sort', filters.sort)
  for (const value of filters.attributes ?? []) next.append('attr', value)
  return next
}
