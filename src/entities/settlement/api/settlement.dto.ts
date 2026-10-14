// 정산 API는 백엔드에 아직 없다(목 응답). 모양은 기획서 7장 ⑦ · 2.1 정산 기준 · settlement.completed data

/** GET /seller/settlement-targets 한 줄 = 구매확정된 주문상품 1건 */
export type SettlementTargetDto = {
  targetId: string
  orderItemId: string
  productName: string
  amount: number
  confirmedAt: string
  settled: boolean
}

/** GET /seller/settlements 한 줄 */
export type SettlementDto = {
  settlementId: string
  sellerId: string
  period: { periodStart: string | null; periodEnd: string }
  itemCount: number
  totalAmount: number
  feeRate: number
  feeAmount: number
  payoutAmount: number
  status: string
  settledAt: string
}

/** GET /seller/settlements/{settlementId} */
export type SettlementDetailDto = SettlementDto & {
  items: { orderItemId: string; productName: string; amount: number; confirmedAt: string }[]
}

/** POST /admin/settlements/run */
export type SettlementRunRequestDto = {
  periodEnd: string
  /** 목 전용: 판매자 지갑 적립 실패를 흉내 낸다 (재처리 시연용, 실제 서버는 무시) */
  simulatePayoutFailure?: boolean
}
export type SettlementRunResultDto = {
  periodEnd: string
  settlementCount: number
  settlements: SettlementDto[]
}
