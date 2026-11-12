/** 관리자 지갑 목록 한 줄 */
export type AdminWallet = {
  id: string
  memberId: string
  balance: number
  /** 회원 탈퇴로 동결한 시각. 동결되지 않았으면 null */
  frozenAt: string | null
}

/** 지갑 목록 거르기. false면 그 조건으로 거르지 않는다 */
export type AdminWalletFilter = {
  frozenOnly: boolean
  withBalanceOnly: boolean
}

/** 잔액 돌려주기 기록 */
export type BalanceReturn = {
  id: string
  walletId: string
  memberId: string
  amount: number
  /** 돌려준 뒤 잔액 (0) */
  balance: number
  returnedAt: string
}
