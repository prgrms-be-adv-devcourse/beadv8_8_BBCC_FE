import type {
  AdminWalletDto,
  AdminWalletParamsDto,
  BalanceReturnDto,
  ReturnBalanceRequestDto,
} from '../api/admin-wallet.dto'
import type { AdminWallet, AdminWalletFilter, BalanceReturn } from './admin-wallet'

const PAGE_SIZE = 20

export function toAdminWallet(dto: AdminWalletDto): AdminWallet {
  return {
    id: String(dto.walletId),
    memberId: String(dto.memberId),
    balance: dto.balance,
    frozenAt: dto.frozenAt,
  }
}

export function toAdminWalletParams(filter: AdminWalletFilter, page: number): AdminWalletParamsDto {
  return {
    frozen: filter.frozenOnly,
    hasBalance: filter.withBalanceOnly,
    page,
    size: PAGE_SIZE,
  }
}

/** 요청 금액은 목록에서 본 잔액 (그사이 바뀌었으면 서버가 409로 막는다) */
export function toReturnBalanceRequest(wallet: AdminWallet): ReturnBalanceRequestDto {
  return { amount: wallet.balance }
}

export function toBalanceReturn(dto: BalanceReturnDto): BalanceReturn {
  return {
    id: String(dto.balanceReturnId),
    walletId: String(dto.walletId),
    memberId: String(dto.memberId),
    amount: dto.amount,
    balance: dto.balance,
    returnedAt: dto.returnedAt,
  }
}
