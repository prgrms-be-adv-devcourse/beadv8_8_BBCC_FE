/** 같은 옵션이 장바구니에 있으면 담기가 그 줄에 합쳐지므로, 합친 수량으로 조른다고 알린다. 없으면 null */
export function wishNowMergeNotice(
  existingQuantity: number | null,
  addQuantity: number,
): string | null {
  if (existingQuantity === null) return null
  return `장바구니에 같은 상품이 ${existingQuantity}개 있어요. 합쳐서 ${existingQuantity + addQuantity}개로 조를게요.`
}

/** ① 담기는 됐는데 ② 조르기가 실패했을 때: 담겼다고 알리고 장바구니에서 다시 조르게 안내한다 */
export function wishNowCartOnlyNotice(reason: string): string {
  return `장바구니에는 담았어요. 조르기는 보내지 못했어요: ${reason} 장바구니에서 다시 조를 수 있어요.`
}
