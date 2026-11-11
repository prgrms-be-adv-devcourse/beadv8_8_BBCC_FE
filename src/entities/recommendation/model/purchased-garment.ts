import type { GarmentPart } from './reference-garment'

/** 자녀에게 산 옷 (구매확정). 상품 정보 · 실측을 모르면 null이고, 기준 옷 폼에서 보호자가 직접 입력한다 */
export type PurchasedGarment = {
  orderItemId: string
  productId: string
  productName: string | null
  categoryId: string | null
  /** 서버가 카테고리로 정한 기준 옷 칸. 기준 옷이 아닌 옷이거나 상품 정보가 없으면 null */
  part: GarmentPart | null
  size: string
  /** 항목 코드 → cm */
  measurements: Record<string, number> | null
  confirmedAt: string
}
