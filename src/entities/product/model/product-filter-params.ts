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
  for (const key of ['cat', 'sort', 'attr', 'page']) next.delete(key)
  if (filters.categoryId) next.set('cat', filters.categoryId)
  if (filters.sort && filters.sort !== 'NEWEST') next.set('sort', filters.sort)
  for (const value of filters.attributes ?? []) next.append('attr', value)
  return next
}

/** 주소의 전체 상품 페이지 (?page=, 1부터) → 0부터. 틀린 값은 첫 페이지 */
export function readProductPage(params: URLSearchParams): number {
  const page = Number(params.get('page'))
  return Number.isInteger(page) && page > 1 ? page - 1 : 0
}

/** 전체 상품 페이지(0부터) → 주소 (?page=, 1부터). 첫 페이지는 싣지 않는다 */
export function writeProductPage(params: URLSearchParams, page: number): URLSearchParams {
  const next = new URLSearchParams(params)
  next.delete('page')
  if (page > 0) next.set('page', String(page + 1))
  return next
}
