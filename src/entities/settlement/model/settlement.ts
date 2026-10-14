export type SettlementTarget = {
  id: string
  productName: string
  amount: number
  confirmedAt: string
  settled: boolean
}

/** COMPLETED = 계산 완료(지급 요청) · FAILED = 판매자 지갑 적립 실패 (재처리 대상) */
export type SettlementStatus = 'COMPLETED' | 'FAILED'

export type Settlement = {
  id: string
  sellerId: string
  status: SettlementStatus
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

export const SETTLEMENT_STATUS_LABEL: Record<SettlementStatus, string> = {
  COMPLETED: '정산 완료',
  FAILED: '적립 실패',
}
