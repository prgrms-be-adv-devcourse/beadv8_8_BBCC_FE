import { canSendWishLine } from '@/entities/wish'

type SendableLine = { id: string; purchasable: boolean; reserved: boolean }

/** 고른 칸 중 지금 보낼 수 있는 칸 (판매 중 · 다른 조르기에 예약되지 않음) */
export function sendableWishIds(items: SendableLine[], selected: string[]): string[] {
  return selected.filter((id) => items.some((item) => item.id === id && canSendWishLine(item)))
}

/** 메시지는 적지 않았으면 보내지 않는다 */
export function wishMessageOrNull(message: string): string | null {
  return message || null
}

/** 고른 줄: 보낼 수 있는 줄 전부에서 사용자가 뺀 줄(excluded)만 빠진다 (처음부터 모두 고른 상태) */
export function selectedWishIds(items: SendableLine[], excluded: string[]): string[] {
  return items
    .filter((item) => canSendWishLine(item) && !excluded.includes(item.id))
    .map((item) => item.id)
}

/** 고른 줄 금액 합계 */
export function wishSelectionTotal(
  items: { id: string; lineAmount: number }[],
  ids: string[],
): number {
  return items
    .filter((item) => ids.includes(item.id))
    .reduce((sum, item) => sum + item.lineAmount, 0)
}
