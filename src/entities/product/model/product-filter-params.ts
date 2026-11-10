import { PRODUCT_SORT_LABEL, type ProductSearch, type ProductSort } from './product'

/** 홈 상품 거르기 (검색어 제외). 주소에 저장해 뒤로 가기 · 링크 공유에도 유지한다 */
export type ProductFilters = Omit<ProductSearch, 'keyword'>

const isSort = (value: string | null): value is ProductSort =>
  value !== null && value in PRODUCT_SORT_LABEL

const hasKeyword = (keyword: string | null) => Boolean(keyword?.trim())

/** 고를 수 있는 정렬: 관련도순은 검색어가 있을 때만 (맨 앞) */
export function sortOptionsFor(keyword: string): ProductSort[] {
  const sorts: ProductSort[] = ['NEWEST', 'PRICE_ASC', 'PRICE_DESC']
  return hasKeyword(keyword) ? ['RELEVANCE', ...sorts] : sorts
}

/** 실제로 쓸 정렬: 고른 값이 없으면 검색어가 있을 때 관련도순, 없을 때 최신순. 검색어 없는 관련도순은 최신순 */
export function effectiveSort(keyword: string, sort: ProductSort | undefined): ProductSort {
  if (sort === 'RELEVANCE' || !sort) return hasKeyword(keyword) ? 'RELEVANCE' : 'NEWEST'
  return sort
}

/** 주소 → 거르기. ?cat=11&sort=PRICE_ASC&attr=COLOR:3&attr=SIZE:7 (모르는 정렬은 버린다. 실제 정렬은 effectiveSort) */
export function readProductFilters(params: URLSearchParams): ProductFilters {
  const sort = params.get('sort')
  const attributes = params.getAll('attr').filter((value) => /^[^:]+:[^:]+$/.test(value))
  return {
    categoryId: params.get('cat') || null,
    ...(isSort(sort) ? { sort } : {}),
    ...(attributes.length > 0 ? { attributes } : {}),
  }
}

/**
 * 거르기 → 주소. 다른 값(검색어 q · 자녀 child)은 그대로 두고, 빈 값과 그 검색어의 기본 정렬
 * (검색어가 있으면 관련도순, 없으면 최신순)은 싣지 않는다
 */
export function writeProductFilters(
  params: URLSearchParams,
  filters: ProductFilters,
): URLSearchParams {
  const next = new URLSearchParams(params)
  for (const key of ['cat', 'sort', 'attr', 'page']) next.delete(key)
  if (filters.categoryId) next.set('cat', filters.categoryId)
  const keyword = next.get('q') ?? ''
  const sort = effectiveSort(keyword, filters.sort)
  if (sort !== effectiveSort(keyword, undefined)) next.set('sort', sort)
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

/** 목록 제목: 검색어가 있으면 검색 결과, 카테고리만이면 카테고리 이름 (필터를 더했으면 개수), 아니면 전체 상품 */
export function productListTitle(
  keyword: string,
  categoryName: string | null,
  attributeCount: number,
): string {
  if (keyword) return `"${keyword}" 검색 결과`
  if (categoryName)
    return attributeCount > 0 ? `${categoryName} · 필터 ${attributeCount}개` : categoryName
  return '전체 상품'
}
