// 정산 API (BE SellerSettlementController · AdminSettlementController). 정산 쪽 ID는 숫자(Long)로 온다

/** GET /seller/settlement-targets 한 줄 = 아직 정산 안 된 구매확정 주문상품 1건 */
export type SettlementTargetDto = {
  orderItemId: number
  orderId: number
  salesAmount: number
  confirmedAt: string
}

/** GET /seller/settlements 한 줄 (BE SettlementSummaryResponse) */
export type SettlementDto = {
  settlementId: number
  periodStartOn: string
  periodEndOn: string
  totalSalesAmount: number
  /** 예: 0.10 */
  feeRate: number
  feeAmount: number
  settlementAmount: number
  /** COMPLETED(정산 완료 · 지급 요청) · PAID(예치금 입금 끝) · FAILED */
  status: string
  completedAt: string | null
  paidAt: string | null
}

/** GET /seller/settlements/{settlementId} */
export type SettlementDetailDto = SettlementDto & {
  failReason: string | null
  items: { orderItemId: number; orderId: number; salesAmount: number; confirmedAt: string }[]
}

/** POST /admin/settlements/run. 이날 0시 전에 구매확정된 대상을 정산한다 */
export type SettlementRunRequestDto = { cutoffOn: string }

/** 정산 실행 기록 (BE SettlementRunResponse) */
export type SettlementRunResultDto = {
  runId: number
  cutoffAt: string
  periodStartOn: string
  periodEndOn: string
  /** SCHEDULED · MANUAL */
  triggerType: string
  /** RUNNING · COMPLETED · PARTIAL_FAILED · FAILED */
  status: string
  successCount: number
  failCount: number
  requestedBy: number | null
  startedAt: string
  finishedAt: string | null
}
