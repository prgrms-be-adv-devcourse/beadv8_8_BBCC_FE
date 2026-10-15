import { apiClient, expectShape, type Page } from '@/shared/api'
import type {
  ChargeCancelResultDto,
  ChargeDetailDto,
  ChargeRequestResultDto,
  ConfirmChargeRequestDto,
  ConfirmChargeResultDto,
  WalletBalanceDto,
  WalletTransactionDto,
} from './wallet.dto'
import {
  chargeCancelShape,
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
  /** 충전 취소 = 토스 결제 취소. 200 = 취소 완료, 202 = 토스 결과 확인 중 (충전액은 이미 빠짐) */
  cancelCharge: (chargeId: string) =>
    apiClient
      .post<ChargeCancelResultDto>(`${CHARGES}/${chargeId}/cancel`)
      .then(expectShape(chargeCancelShape)),
}
