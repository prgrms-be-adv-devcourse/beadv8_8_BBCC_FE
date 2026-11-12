import type { AdminWallet } from './admin-wallet'

/** 탈퇴로 동결됐고 잔액이 남은 지갑만 잔액을 돌려줄 수 있다 (BE WALLET_NOT_FROZEN 409 · 금액 @Positive) */
export function canReturnWalletBalance(wallet: Pick<AdminWallet, 'frozenAt' | 'balance'>): boolean {
  return wallet.frozenAt !== null && wallet.balance > 0
}
