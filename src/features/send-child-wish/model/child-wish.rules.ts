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
