/** 「더 보기」로 부를 다음 페이지 (page는 0부터). 더 없으면 undefined */
export function nextPageOf(page: { page: number; hasNext: boolean }): number | undefined {
  return page.hasNext ? page.page + 1 : undefined
}

/** 페이지 번호 줄: 지금 페이지를 가운데에 두고 최대 count개 (page는 0부터) */
export function pageNumbersOf(page: number, totalPages: number, count = 5): number[] {
  const size = Math.min(count, totalPages)
  const start = Math.min(Math.max(0, page - Math.floor(count / 2)), totalPages - size)
  return Array.from({ length: size }, (_, i) => start + i)
}
