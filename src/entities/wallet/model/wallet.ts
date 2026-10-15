export type Wallet = { balance: number }

export type ChargeStatus =
  'PENDING' | 'CONFIRMING' | 'DONE' | 'CANCELLING' | 'CANCELLED' | 'FAILED' | 'EXPIRED'

export type Charge = {
  id: string
  amount: number
  status: ChargeStatus
  approvedAt: string | null
  /** 충전 요청 시각 */
  createdAt: string
}

/** 토스 결제창에 넘길 값 */
export type ChargePayment = { chargeId: string; tossOrderId: string; amount: number }

/** 충전 승인 결과. 토스 결과를 아직 모르면(202) CONFIRMING이고 잔액은 null */
export type ChargeConfirmation = {
  chargeId: string
  status: ChargeStatus
  amount: number
  balance: number | null
}

/** 충전 취소 결과 (BE ChargeCancelResponse). 취소 중이면 balance null */
export type ChargeCancellation = {
  chargeId: string
  status: ChargeStatus
  amount: number
  balance: number | null
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

/** 예치금 거래 종류 (BE WalletLedgerType) */
export type WalletTxType =
  'CHARGE' | 'CHARGE_CANCEL' | 'CHARGE_CANCEL_REVERT' | 'PAYMENT' | 'REFUND' | 'SETTLEMENT'

/** 예치금 거래 한 줄 (잔액이 바뀔 때마다 쌓이는 원장) */
export type WalletTransaction = {
  id: string
  type: WalletTxType
  /** 입금은 양수, 출금은 음수 */
  amount: number
  balanceAfter: number
  /** 원인 ID (충전 · 결제 · 환불 · 정산). 없으면 null */
  refId: string | null
  createdAt: string
  deposit: boolean
}

export const WALLET_TX_LABEL: Record<WalletTxType, string> = {
  CHARGE: '충전',
  CHARGE_CANCEL: '충전 취소',
  CHARGE_CANCEL_REVERT: '충전 취소 되돌림',
  PAYMENT: '주문 결제',
  REFUND: '환불',
  SETTLEMENT: '정산 적립',
}
