// 추천 기준 옷 「산 옷에서 고르기」 (BE #1168 PurchasedGarmentResponse)

/**
 * GET /recommendations/children/{childId}/purchases 한 줄: 구매확정된 주문상품 (확정이 늦은 순서).
 * 상품 정보가 없으면 productName · categoryId · measurements가 null, 산 사이즈의 실측이 없으면 measurements만 null
 */
export type PurchasedGarmentDto = {
  orderItemId: string
  productId: string
  productName: string | null
  /** 상품의 말단 카테고리 */
  categoryId: string | null
  /** 주문 당시 사이즈 */
  size: string
  /** 산 사이즈의 실측: 항목 코드 → cm */
  measurements: Record<string, number> | null
  confirmedAt: string
}
