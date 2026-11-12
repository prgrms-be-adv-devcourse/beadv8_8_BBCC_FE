/** GET /admin/wallets 한 줄 (BE AdminWalletResponse) */
export type AdminWalletDto = {
  walletId: number
  memberId: number
  /** 남은 예치금(원) */
  balance: number
  /** 회원 탈퇴로 동결한 시각. 동결되지 않았으면 null */
  frozenAt: string | null
}

/** GET /admin/wallets 검색 값. frozen · hasBalance가 false면 그 조건으로 거르지 않는다 (size 최대 100) */
export type AdminWalletParamsDto = {
  frozen: boolean
  hasBalance: boolean
  page: number
  size: number
}

/** POST /admin/wallets/{walletId}/return-balance (BE ReturnBalanceRequest). 목록에서 본 잔액, 지금 잔액과 다르면 409 */
export type ReturnBalanceRequestDto = { amount: number }

/** POST /admin/wallets/{walletId}/return-balance 응답 (BE BalanceReturnResponse) */
export type BalanceReturnDto = {
  balanceReturnId: number
  walletId: number
  memberId: number
  amount: number
  /** 돌려준 뒤 잔액 (0) */
  balance: number
  ledgerId: number
  returnedAt: string
}
