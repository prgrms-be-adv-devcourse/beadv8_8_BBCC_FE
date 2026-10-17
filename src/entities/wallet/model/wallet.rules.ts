import type { Charge } from './wallet'

const CHARGE_MIN = 1_000
const CHARGE_MAX = 1_000_000

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

/** 결제창에서 결제를 마치지 못해 아직 대기 중인 충전인지 (만료 시각이 지나면 서버가 곧 만료로 끝낸다) */
export function isAwaitingPayment(charge: Charge, now: Date): boolean {
  return charge.status === 'PENDING' && new Date(charge.expiresAt).getTime() > now.getTime()
}

/** 주문 금액보다 모자란 금액 (모자라지 않으면 0) */
export function shortageOf(balance: number | undefined, amount: number): number {
  return balance === undefined ? 0 : Math.max(0, amount - balance)
}

/** 토스 결과를 아직 몰라 충전 취소를 확인 중(202)인지 */
export function isChargeCancelling(result: { status: string }): boolean {
  return result.status === 'CANCELLING'
}

/** 토스 결과를 아직 몰라 승인 확인 중(202)인지 */
export function isChargeConfirming(confirmation: { status: string }): boolean {
  return confirmation.status === 'CONFIRMING'
}

/** 부족한 금액을 채울 충전 금액: 천 원 단위로 올리고 충전 한도 안으로. 부족하지 않으면 null */
export function suggestChargeAmount(shortage: number): number | null {
  if (shortage <= 0) {
    return null
  }
  const rounded = Math.ceil(shortage / 1_000) * 1_000
  return Math.min(CHARGE_MAX, Math.max(CHARGE_MIN, rounded))
}
