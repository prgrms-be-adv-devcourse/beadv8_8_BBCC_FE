import { apiClient, expectShape, type Page } from '@/shared/api'
import type {
  ChargeCancelResultDto,
  ChargeDetailDto,
  ChargeRequestResultDto,
  ConfirmChargeRequestDto,
  ConfirmChargeResultDto,
  FailChargeRequestDto,
  WalletBalanceDto,
  WalletLedgerDto,
} from './wallet.dto'
import {
  chargeCancelShape,
  chargeConfirmShape,
  chargePageShape,
  chargeRequestShape,
  chargeShape,
  walletShape,
  walletLedgerPageShape,
} from './wallet.shape'

const CHARGES = '/wallets/me/charges'

export const walletApi = {
  /** accessToken을 주면 지금 로그인과 상관없이 그 계정의 잔액 (자동 시연 시작 전 점검) */
  getMine: (accessToken?: string) =>
    apiClient
      .get<WalletBalanceDto>(
        '/wallets/me',
        accessToken
          ? { skipAuth: true, headers: { Authorization: `Bearer ${accessToken}` } }
          : undefined,
      )
      .then(expectShape(walletShape)),
  /** 내 충전 내역 (상태와 상관없이 최신순) */
  listCharges: () =>
    apiClient
      .get<Page<ChargeDetailDto>>(CHARGES, { params: { page: 0, size: 20 } })
      .then(expectShape(chargePageShape)),
  /** 예치금 거래 내역 (BE 입출금 원장, 최신순) */
  listTransactions: () =>
    apiClient
      .get<Page<WalletLedgerDto>>('/wallets/me/ledgers', {
        params: { page: 0, size: 50 },
      })
      .then(expectShape(walletLedgerPageShape)),
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
  /** 결제창이 끝나지 않은 충전을 실패로 끝낸다. 이미 실패한 충전이면 그대로 200 */
  failCharge: (request: FailChargeRequestDto) =>
    apiClient.post<ChargeDetailDto>(`${CHARGES}/fail`, request).then(expectShape(chargeShape)),
  /** 충전 취소 = 토스 결제 취소. 200 = 취소 완료, 202 = 토스 결과 확인 중 (충전액은 이미 빠짐) */
  cancelCharge: (chargeId: string) =>
    apiClient
      .post<ChargeCancelResultDto>(`${CHARGES}/${chargeId}/cancel`)
      .then(expectShape(chargeCancelShape)),
}
