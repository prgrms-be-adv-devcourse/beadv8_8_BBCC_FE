/**
 * POST /search/clicks (BE SearchClickRequest). keyword · sort는 그 목록을 찾을 때 보낸 값,
 * productId는 Long이라 숫자로 보낸다. rank는 보여 준 목록에서 누른 위치(첫 페이지 첫 상품이 1, 10000까지).
 * childId는 보호자가 고른 자녀(선택). 보내지 않으면 자녀 없이 기록한다
 */
export type SearchClickRequestDto = {
  keyword: string
  productId: number
  rank: number
  sort: string
  childId?: number
}
