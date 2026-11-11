/** 자녀에게 산 옷 (구매확정). 상품 정보 · 실측을 모르면 null이고, 기준 옷 폼에서 보호자가 직접 입력한다 */
export type PurchasedGarment = {
  orderItemId: string
  productId: string
  productName: string | null
  categoryId: string | null
  size: string
  /** 항목 코드 → cm */
  measurements: Record<string, number> | null
  confirmedAt: string
}
