/** GET /wallets/me */
export type WalletBalanceDto = { balance: number }

/** GET /wallets/me/charges/{chargeId} */
export type ChargeDetailDto = {
  chargeId: number
  /** 토스 주문번호 */
  orderId: string
  amount: number
  status: string
  approvedAt: string | null
}

/** POST /wallets/me/charges → 토스 결제창에 넘길 값 */
export type ChargeRequestResultDto = {
  chargeId: number
  orderId: string
  amount: number
  expiresAt: string
}

/** POST /wallets/me/charges/confirm (토스 successUrl로 돌아온 값 그대로) */
export type ConfirmChargeRequestDto = { paymentKey: string; orderId: string; amount: number }
export type ConfirmChargeResultDto = {
  chargeId: number
  status: string
  amount: number
  balance: number | null
}

/** GET /wallets/me/transactions 한 줄 (기획서 8장 보완 · BE 미구현 → 목, 모양은 BE WalletLedger) */
export type WalletTransactionDto = {
  transactionId: number
  type: string
  amount: number
  balanceAfter: number
  refId: number
  createdAt: string
}
