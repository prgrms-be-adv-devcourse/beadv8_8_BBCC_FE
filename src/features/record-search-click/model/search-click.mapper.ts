import type { ProductSort } from '@/entities/product'
import type { SearchClickRequestDto } from '../api/record-search-click.dto'

/** 검색 결과에서 누른 상품. page · index는 0부터, size는 그 목록의 페이지 크기 */
export type SearchClick = {
  keyword: string
  productId: string
  page: number
  size: number
  index: number
  sort: ProductSort
}

const KEYWORD_MAX = 50
const RANK_MAX = 10_000

/** BE가 400으로 거절할 값(빈 · 50자 넘는 검색어, 10000 넘는 순위, 숫자가 아닌 상품 ID)이면 보내지 않는다 (null) */
export function toSearchClickRequest(click: SearchClick): SearchClickRequestDto | null {
  const keyword = click.keyword.trim()
  const productId = Number(click.productId)
  const rank = click.page * click.size + click.index + 1
  if (!keyword || keyword.length > KEYWORD_MAX) return null
  if (!Number.isSafeInteger(productId) || productId <= 0) return null
  if (rank > RANK_MAX) return null
  return { keyword, productId, rank, sort: click.sort }
}
