export type SettlementTarget = {
  id: string
  productName: string
  amount: number
  confirmedAt: string
  settled: boolean
}

export type Settlement = {
  id: string
  sellerId: string
  /** 이 날 0시 이전 구매확정분 (시작일 조건 없음, 기획서 2.1) */
  periodEnd: string
  itemCount: number
  totalAmount: number
  feeRatePercent: number
  feeAmount: number
  payoutAmount: number
}

export type SettlementDetail = Settlement & {
  items: { orderItemId: string; productName: string; amount: number; confirmedAt: string }[]
}

export type SettlementRunResult = {
  settlementCount: number
  settlements: Settlement[]
}
