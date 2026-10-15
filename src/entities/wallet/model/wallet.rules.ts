import type { Charge } from './wallet'

export const CHARGE_MIN = 1_000
export const CHARGE_MAX = 1_000_000

export function validateChargeAmount(amount: number): string | null {
  if (!Number.isInteger(amount) || amount < CHARGE_MIN || amount > CHARGE_MAX) {
    return '충전 금액은 1천 원 ~ 100만 원이에요.'
  }
  return null
}

/** 충전 완료된 건만 취소할 수 있다 (잔액 조건은 서버가 판단, 기획서 P7) */
export function canCancelCharge(charge: Charge): boolean {
  return charge.status === 'DONE'
}

/** 주문 금액보다 모자란 금액 (모자라지 않으면 0) */
export function shortageOf(balance: number | undefined, amount: number): number {
  return balance === undefined ? 0 : Math.max(0, amount - balance)
}

/** 토스 결과를 아직 몰라 승인 확인 중(202)인지 */
export function isChargeConfirming(confirmation: { status: string }): boolean {
  return confirmation.status === 'CONFIRMING'
}
