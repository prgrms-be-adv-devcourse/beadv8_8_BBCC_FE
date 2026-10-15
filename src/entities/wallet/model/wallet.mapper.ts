import type {
  ChargeCancelResultDto,
  ChargeDetailDto,
  ChargeRequestResultDto,
  ConfirmChargeRequestDto,
  ConfirmChargeResultDto,
  WalletLedgerDto,
} from '../api/wallet.dto'
import type {
  Charge,
  ChargeCancellation,
  ChargeConfirmation,
  ChargePayment,
  ChargeStatus,
  WalletTransaction,
  WalletTxType,
} from './wallet'

export function toCharge(dto: ChargeDetailDto): Charge {
  return {
    id: String(dto.chargeId),
    amount: dto.amount,
    status: dto.status as ChargeStatus,
    approvedAt: dto.approvedAt,
    createdAt: dto.createdAt,
  }
}

export function toChargePayment(dto: ChargeRequestResultDto): ChargePayment {
  return { chargeId: String(dto.chargeId), tossOrderId: dto.orderId, amount: dto.amount }
}

export function toChargeConfirmation(dto: ConfirmChargeResultDto): ChargeConfirmation {
  return {
    chargeId: String(dto.chargeId),
    status: dto.status as ChargeStatus,
    amount: dto.amount,
    balance: dto.balance,
  }
}

export function toChargeCancellation(dto: ChargeCancelResultDto): ChargeCancellation {
  return {
    chargeId: String(dto.chargeId),
    status: dto.status as ChargeStatus,
    amount: dto.amount,
    balance: dto.balance,
  }
}

/** 토스 successUrl 쿼리(paymentKey · orderId · amount) → 승인 요청. 빠진 값이 있으면 null */
export function toConfirmChargeRequest(search: URLSearchParams): ConfirmChargeRequestDto | null {
  const paymentKey = search.get('paymentKey')
  const orderId = search.get('orderId')
  const amount = Number(search.get('amount'))
  return paymentKey && orderId && amount > 0 ? { paymentKey, orderId, amount } : null
}

export function toWalletTransaction(dto: WalletLedgerDto): WalletTransaction {
  return {
    id: String(dto.ledgerId),
    type: dto.type as WalletTxType,
    amount: dto.amount,
    balanceAfter: dto.balanceAfter,
    refId: dto.refId === null ? null : String(dto.refId),
    createdAt: dto.createdAt,
    deposit: dto.amount > 0,
  }
}
