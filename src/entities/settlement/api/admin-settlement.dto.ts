import type { SettlementDto } from './settlement.dto'

/** GET /admin/settlements 한 줄 (BE AdminSettlementSummaryResponse). 판매자 응답에 판매자 ID · 지급 실패 사유를 더한다 */
export type AdminSettlementDto = SettlementDto & {
  sellerId: number
  /** 지급 실패 전에는 null */
  failReason: string | null
}
