/** GET /wallets/me */
export type WalletBalance = {
  balance: number
}

export type ChargeStatus =
  'PENDING' | 'CONFIRMING' | 'DONE' | 'CANCELLING' | 'CANCELLED' | 'FAILED' | 'EXPIRED'

/** GET /wallets/me/charges/{chargeId} */
export type ChargeDetail = {
  chargeId: number
  /** 토스 주문번호 */
  orderId: string
  amount: number
  status: ChargeStatus
  approvedAt: string | null
}

export const CHARGE_STATUS_LABEL: Record<ChargeStatus, string> = {
  PENDING: '결제 대기',
  CONFIRMING: '승인 중',
  DONE: '충전 완료',
  CANCELLING: '취소 중',
  CANCELLED: '취소됨',
  FAILED: '실패',
  EXPIRED: '만료',
}
