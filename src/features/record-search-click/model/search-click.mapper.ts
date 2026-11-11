import type { ProductSort } from '@/entities/product'
import type { SearchClickRequestDto } from '../api/record-search-click.dto'

/** 검색 결과에서 누른 상품. page · index는 0부터, size는 그 목록의 페이지 크기, childId는 보호자가 고른 자녀(없으면 null) */
export type SearchClick = {
  keyword: string
  productId: string
  page: number
  size: number
  index: number
  sort: ProductSort
  childId: string | null
}

const KEYWORD_MAX = 50
const RANK_MAX = 10_000

const toPositiveId = (id: string | null): number | null => {
  const value = Number(id)
  return id !== null && Number.isSafeInteger(value) && value > 0 ? value : null
}

/**
 * BE가 400으로 거절할 값(빈 · 50자 넘는 검색어, 10000 넘는 순위, 숫자가 아닌 상품 ID)이면 보내지 않는다 (null).
 * 고른 자녀는 양수 숫자일 때만 싣고, 아니면 자녀 없이 기록한다
 */
export function toSearchClickRequest(click: SearchClick): SearchClickRequestDto | null {
  const keyword = click.keyword.trim()
  const productId = toPositiveId(click.productId)
  const childId = toPositiveId(click.childId)
  const rank = click.page * click.size + click.index + 1
  if (!keyword || keyword.length > KEYWORD_MAX) return null
  if (productId === null) return null
  if (rank > RANK_MAX) return null
  return { keyword, productId, rank, sort: click.sort, ...(childId !== null && { childId }) }
}
