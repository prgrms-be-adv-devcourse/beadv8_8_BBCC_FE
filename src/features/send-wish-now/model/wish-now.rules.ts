import { MAX_QUANTITY } from '@/entities/cart'

/** 같은 옵션이 장바구니에 있으면 담기가 그 줄에 합쳐지므로, 합친 수량으로 조른다고 알린다. 없으면 null */
export function wishNowMergeNotice(
  existingQuantity: number | null,
  addQuantity: number,
): string | null {
  if (existingQuantity === null) return null
  return `장바구니에 같은 상품이 ${existingQuantity}개 있어요. 합쳐서 ${existingQuantity + addQuantity}개로 조를게요.`
}

/** 합친 수량이 한 칸 최대(99)를 넘으면 서버가 담기를 거절하므로, 미리 막고 더 조를 수 있는 수를 알린다. 넘지 않으면 null */
export function wishNowOverLimitNotice(
  existingQuantity: number | null,
  addQuantity: number,
): string | null {
  const existing = existingQuantity ?? 0
  if (existing + addQuantity <= MAX_QUANTITY) return null
  const room = MAX_QUANTITY - existing
  const rest = room > 0 ? `${room}개까지만 더 조를 수 있어요.` : '더 조를 수 없어요.'
  return `장바구니에 같은 상품이 ${existing}개 있어요. 한 상품은 ${MAX_QUANTITY}개까지 담을 수 있어 ${rest}`
}

/** ① 담기는 됐는데 ② 조르기가 실패했을 때: 담겼다고 알리고 장바구니에서 다시 조르게 안내한다 */
export function wishNowCartOnlyNotice(reason: string): string {
  return `장바구니에는 담았어요. 조르기는 보내지 못했어요: ${reason} 장바구니에서 다시 조를 수 있어요.`
}
