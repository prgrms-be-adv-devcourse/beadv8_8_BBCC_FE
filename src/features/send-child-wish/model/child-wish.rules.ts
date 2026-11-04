import { canSendWishLine } from '@/entities/wish'

type SendableLine = { wishItemId: string; purchasable: boolean; requestId: string | null }

/** 고른 줄 중 지금 보낼 수 있는 줄 (판매 중 · 진행 중인 조르기에 없음) */
export function sendableWishIds(items: SendableLine[], selected: string[]): string[] {
  return selected.filter((id) =>
    items.some((item) => item.wishItemId === id && canSendWishLine(item)),
  )
}

/** 메시지는 적지 않았으면 보내지 않는다 */
export function wishMessageOrNull(message: string): string | null {
  return message || null
}
