/** 아직 정산 안 된 구매확정 주문상품 (BE 응답에 상품명이 없어 주문 번호로 보여 준다) */
export type SettlementItem = {
  orderItemId: string
  orderId: string
  amount: number
  confirmedAt: string
}

/** COMPLETED = 정산 완료(지급 요청) · PAID = 예치금 입금 끝 · FAILED = 실패 */
export type SettlementStatus = 'COMPLETED' | 'PAID' | 'FAILED'

export type Settlement = {
  id: string
  status: SettlementStatus
  periodStart: string
  periodEnd: string
  totalAmount: number
  feeRatePercent: number
  feeAmount: number
  payoutAmount: number
  completedAt: string | null
  paidAt: string | null
}

export type SettlementDetail = Settlement & {
  failReason: string | null
  items: SettlementItem[]
}

export type SettlementRunResult = {
  runId: string
  status: string
  successCount: number
  failCount: number
  periodStart: string
  periodEnd: string
}

export const SETTLEMENT_STATUS_LABEL: Record<SettlementStatus, string> = {
  COMPLETED: '정산 완료',
  PAID: '지급 완료',
  FAILED: '실패',
}

export const SETTLEMENT_RUN_STATUS_LABEL: Record<string, string> = {
  RUNNING: '실행 중',
  COMPLETED: '완료',
  PARTIAL_FAILED: '일부 실패',
  FAILED: '실패',
}
