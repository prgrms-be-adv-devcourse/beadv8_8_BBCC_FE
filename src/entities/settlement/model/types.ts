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
  periodEnd: string
  itemCount: number
  totalAmount: number
  feeRate: number
  feeAmount: number
  payoutAmount: number
  status: 'COMPLETED'
  settledAt: string
}

/** POST /admin/settlements/run 결과 */
export type SettlementRunResult = {
  periodEnd: string
  settlementCount: number
  settlements: Settlement[]
}
