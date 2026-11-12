import { apiClient, expectShape, type Page } from '@/shared/api'
import type {
  AdminWalletDto,
  AdminWalletParamsDto,
  BalanceReturnDto,
  ReturnBalanceRequestDto,
} from './admin-wallet.dto'
import { adminWalletPageShape, balanceReturnShape } from './admin-wallet.shape'

export const adminWalletApi = {
  /** 모든 회원의 예치금 지갑 (최신순) */
  list: (params: AdminWalletParamsDto) =>
    apiClient
      .get<Page<AdminWalletDto>>('/admin/wallets', { params })
      .then(expectShape(adminWalletPageShape)),
  /** 동결된 지갑의 남은 잔액을 돌려줬다고 기록하고 잔액을 0으로 만든다 (실제 송금은 하지 않음). 동결 아님 · 잔액이 바뀜은 409 */
  returnBalance: (walletId: string, request: ReturnBalanceRequestDto) =>
    apiClient
      .post<BalanceReturnDto>(`/admin/wallets/${walletId}/return-balance`, request)
      .then(expectShape(balanceReturnShape)),
}
