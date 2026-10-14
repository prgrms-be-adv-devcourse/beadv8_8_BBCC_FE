export type Wallet = { balance: number }

export type ChargeStatus =
  'PENDING' | 'CONFIRMING' | 'DONE' | 'CANCELLING' | 'CANCELLED' | 'FAILED' | 'EXPIRED'

export type Charge = {
  id: string
  amount: number
  status: ChargeStatus
  approvedAt: string | null
}

/** 토스 결제창에 넘길 값 */
export type ChargePayment = { chargeId: string; tossOrderId: string; amount: number }

export type ChargeConfirmation = { chargeId: string; amount: number; balance: number | null }

export const CHARGE_STATUS_LABEL: Record<ChargeStatus, string> = {
  PENDING: '결제 대기',
  CONFIRMING: '승인 중',
  DONE: '충전 완료',
  CANCELLING: '취소 중',
  CANCELLED: '취소됨',
  FAILED: '실패',
  EXPIRED: '만료',
}
