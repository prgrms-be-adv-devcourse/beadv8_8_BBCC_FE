/**
 * POST /search/clicks (BE SearchClickRequest). keyword · sort는 그 목록을 찾을 때 보낸 값,
 * productId는 Long이라 숫자로 보낸다. rank는 보여 준 목록에서 누른 위치(첫 페이지 첫 상품이 1, 10000까지)
 */
export type SearchClickRequestDto = {
  keyword: string
  productId: number
  rank: number
  sort: string
}
