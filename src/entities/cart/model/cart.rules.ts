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
