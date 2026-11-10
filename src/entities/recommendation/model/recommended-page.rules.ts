/** 맞춤 목록 「더 보기」로 부를 다음 쪽 (page는 0부터). 같은 기준 시각으로 계산해야 쪽 사이 순서가 지켜진다 */
export type RecommendedPageParam = { page: number; asOf?: string }

/** 다음 쪽이 있으면 그 쪽의 asOf를 그대로 넘긴다. 더 없으면 undefined */
export function nextRecommendedPageOf(last: {
  page: number
  hasNext: boolean
  asOf: string
}): RecommendedPageParam | undefined {
  return last.hasNext ? { page: last.page + 1, asOf: last.asOf } : undefined
}
