/** 장바구니 · 주문 줄의 옵션 표시: 옵션 이름 → 없으면 "사이즈 N" → 둘 다 없으면 null(표시 생략) */
export function optionLabel(item: {
  optionName: string | null
  size: string | null
}): string | null {
  const name = item.optionName?.trim()
  if (name) return name
  return item.size ? `사이즈 ${item.size}` : null
}
