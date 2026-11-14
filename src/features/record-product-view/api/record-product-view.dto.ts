/**
 * POST /recommendations/product-views (BE ProductViewRequest).
 * childId는 자녀를 골랐을 때만, viewType은 담기 팝업을 연 것(QUICK)일 때만 넣는다 (없으면 백엔드가 상세 진입으로 본다)
 */
export type ProductViewRequestDto = {
  productId: string
  childId?: string
  viewType?: 'DETAIL' | 'QUICK'
}
