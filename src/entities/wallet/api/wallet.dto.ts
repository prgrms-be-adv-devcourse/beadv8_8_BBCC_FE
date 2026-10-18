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
  /** 이 시각까지 결제창에서 돌아오지 않으면 서버가 만료로 끝낸다 */
  expiresAt: string
  /** 충전 요청 시각 */
  createdAt: string
}

/** POST /wallets/me/charges/fail (토스 failUrl로 돌아온 값 그대로) → ChargeDetailDto */
export type FailChargeRequestDto = { orderId: string; code: string }

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

/** POST /wallets/me/charges/{chargeId}/cancel (BE ChargeCancelResponse). 200 = 취소 완료, 202 = 토스 결과 확인 중(balance null) */
export type ChargeCancelResultDto = {
  chargeId: number
  status: string
  amount: number
  balance: number | null
}

/** GET /wallets/me/ledgers 한 줄 (BE WalletLedgerResponse). 출금은 amount가 음수 */
export type WalletLedgerDto = {
  ledgerId: number
  type: string
  amount: number
  balanceAfter: number
  refId: number | null
  createdAt: string
}
