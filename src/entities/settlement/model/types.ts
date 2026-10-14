// 정산 API는 백엔드에 아직 없다(목 응답). 모양은 기획서 7장 ⑦ · 2.1 정산 기준을 따른다

/** GET /seller/settlement-targets 한 줄 = 구매확정된 주문상품 1건 */
export type SettlementTarget = {
  targetId: string
  orderItemId: string
  productName: string
  amount: number
  confirmedAt: string
  settled: boolean
}

/** GET /seller/settlements 한 줄 */
export type Settlement = {
  settlementId: string
  sellerId: string
  /** 기획서 2.1: 시작일 조건 없음(null), 종료 기준일 이전 구매확정분 전체 */
  period: { periodStart: string | null; periodEnd: string }
  itemCount: number
  totalAmount: number
  feeRate: number
  feeAmount: number
  payoutAmount: number
  status: 'COMPLETED'
  settledAt: string
}

/** GET /seller/settlements/{settlementId} */
export type SettlementDetail = Settlement & {
  items: { orderItemId: string; productName: string; amount: number; confirmedAt: string }[]
}

/** POST /admin/settlements/run 결과 */
export type SettlementRunResult = {
  periodEnd: string
  settlementCount: number
  settlements: Settlement[]
}
