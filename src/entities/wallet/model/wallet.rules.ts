import type { Charge, WalletTransaction } from './wallet'

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

/** 충전 취소 응답 안내: 200은 취소 완료, 202는 토스 결과 확인 중 (충전액은 이미 빠짐) */
export function cancelChargeNoticeOf(result: { status: string }): string {
  return isChargeCancelling(result) ? '토스에서 취소를 확인하는 중이에요' : '충전을 취소했어요'
}

/**
 * 승인 · 실패 처리 요청이 이미 끝난 충전(승인 · 실패 · 만료)에 갔는지. BE는 대기 중이 아닌 충전에 409를 준다.
 * 성공 화면 새로고침, 30분 넘게 머문 결제창에서 돌아온 경우 등이다
 */
export function isChargeAlreadyEnded(status: number | null): boolean {
  return status === 409
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

const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토']

/** 이용 내역 하루 묶음: 날짜(YYYY-MM-DD) · 이름(「10월 20일 화요일」) · 그날 거래 (최신이 위) */
export type WalletTransactionDay = { date: string; label: string; items: WalletTransaction[] }

/** 예치금 이용 내역을 날짜별로 묶는다 (최신 날짜 · 최신 거래가 위) */
export function transactionsByDay(transactions: WalletTransaction[]): WalletTransactionDay[] {
  const sorted = [...transactions].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const days = new Map<string, WalletTransaction[]>()
  for (const tx of sorted) {
    const date = tx.createdAt.slice(0, 10)
    days.set(date, [...(days.get(date) ?? []), tx])
  }
  return [...days].map(([date, items]) => {
    const [y, m, d] = date.split('-').map(Number)
    const weekday = WEEKDAY[new Date(y, m - 1, d).getDay()]
    return { date, label: `${m}월 ${d}일 ${weekday}요일`, items }
  })
}
