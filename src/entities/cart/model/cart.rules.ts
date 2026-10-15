import type { Cart, CartLine } from './cart'

/** 주문할 수 있는 줄만 (판매 중 · 품절 아님 · 단가 있음) */
export function orderableLines(cart: Cart): CartLine[] {
  return cart.lines.filter((line) => line.purchasable && line.unitPrice !== null)
}

export function sumLineAmount(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.lineAmount, 0)
}

export function canDecrease(line: CartLine): boolean {
  return line.quantity > 1
}

/** 주문할 줄: 주문할 수 있는 줄 중 선택을 빼지 않은 것 (새로 담은 줄은 선택된 채로 시작) */
export function selectedLines(cart: Cart, excludedIds: ReadonlySet<string>): CartLine[] {
  return orderableLines(cart).filter((line) => !excludedIds.has(line.id))
}

/** 주문할 수 있는 줄이 모두 선택됐는지 (주문할 줄이 없으면 false) */
export function isAllSelected(cart: Cart, excludedIds: ReadonlySet<string>): boolean {
  const orderable = orderableLines(cart)
  return orderable.length > 0 && orderable.every((line) => !excludedIds.has(line.id))
}

export type SellerGroup = { sellerId: string | null; lines: CartLine[] }

/** 판매자별 묶음 (기획서 F05). 처음 나온 순서를 지키고, 판매자를 모르는 줄은 맨 뒤 한 묶음 */
export function groupBySeller(lines: CartLine[]): SellerGroup[] {
  const groups = new Map<string | null, CartLine[]>()
  for (const line of lines) {
    const key = line.sellerId
    groups.set(key, [...(groups.get(key) ?? []), line])
  }
  const known = [...groups].filter(([sellerId]) => sellerId !== null)
  const unknown = groups.get(null)
  return [
    ...known.map(([sellerId, group]) => ({ sellerId, lines: group })),
    ...(unknown ? [{ sellerId: null, lines: unknown }] : []),
  ]
}
