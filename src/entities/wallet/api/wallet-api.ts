import { apiClient, expectShape, type Page } from '@/shared/api'
import type {
  ChargeDetailDto,
  ChargeRequestResultDto,
  ConfirmChargeRequestDto,
  ConfirmChargeResultDto,
  WalletBalanceDto,
  WalletTransactionDto,
} from './wallet.dto'
import {
  chargeConfirmShape,
  chargePageShape,
  chargeRequestShape,
  chargeShape,
  walletShape,
  walletTransactionPageShape,
} from './wallet.shape'

const CHARGES = '/wallets/me/charges'

export const walletApi = {
  getMine: () => apiClient.get<WalletBalanceDto>('/wallets/me').then(expectShape(walletShape)),
  /** 내 충전 내역 (상태와 상관없이 최신순) */
  listCharges: () =>
    apiClient
      .get<Page<ChargeDetailDto>>(CHARGES, { params: { page: 0, size: 20 } })
      .then(expectShape(chargePageShape)),
  /** 예치금 거래 내역 (기획서 8장 보완). 백엔드에 아직 없어 목 응답이다 */
  listTransactions: () =>
    apiClient
      .get<Page<WalletTransactionDto>>('/wallets/me/transactions', {
        params: { page: 0, size: 50 },
      })
      .then(expectShape(walletTransactionPageShape)),
  getCharge: (chargeId: string) =>
    apiClient.get<ChargeDetailDto>(`${CHARGES}/${chargeId}`).then(expectShape(chargeShape)),
  /** 금액 범위(1천 원 ~ 100만 원)는 서버가 확인한다 */
  requestCharge: (amount: number) =>
    apiClient
      .post<ChargeRequestResultDto>(CHARGES, { amount })
      .then(expectShape(chargeRequestShape)),
  confirmCharge: (request: ConfirmChargeRequestDto) =>
    apiClient
      .post<ConfirmChargeResultDto>(`${CHARGES}/confirm`, request)
      .then(expectShape(chargeConfirmShape)),
  /**
   * 충전 취소 = 토스 결제 취소. 기획서 ④(과제 필수)지만 백엔드에 아직 없어 목 응답이다.
   * 경로는 구현된 충전 API 앞부분(/wallets/me/charges)에 맞췄다.
   */
  cancelCharge: (chargeId: string) => apiClient.post(`${CHARGES}/${chargeId}/cancel`),
}
