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

/**
 * 토스를 부르는 요청(충전 승인 · 취소)의 시간 제한. 기본 10초보다 길다.
 * BE는 토스 응답을 최대 33초(toss.connect-timeout 3초 + toss.read-timeout 30초) 기다린 뒤 결과를 모르면 202를 주므로,
 * 그보다 오래 기다려야 BE가 끝낸 결과(승인 · 확인 중)를 받는다. BE 설정을 바꾸면 이 값도 함께 바꾼다
 */
const TOSS_CALL_TIMEOUT_MS = 40_000

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
      .post<ConfirmChargeResultDto>(`${CHARGES}/confirm`, request, {
        timeout: TOSS_CALL_TIMEOUT_MS,
      })
      .then(expectShape(chargeConfirmShape)),
  /** 결제창이 끝나지 않은 충전을 실패로 끝낸다. 이미 실패한 충전이면 그대로 200 */
  failCharge: (request: FailChargeRequestDto) =>
    apiClient.post<ChargeDetailDto>(`${CHARGES}/fail`, request).then(expectShape(chargeShape)),
  /** 충전 취소 = 토스 결제 취소. 200 = 취소 완료, 202 = 토스 결과 확인 중 (충전액은 이미 빠짐) */
  cancelCharge: (chargeId: string) =>
    apiClient
      .post<ChargeCancelResultDto>(`${CHARGES}/${chargeId}/cancel`, undefined, {
        timeout: TOSS_CALL_TIMEOUT_MS,
      })
      .then(expectShape(chargeCancelShape)),
}
