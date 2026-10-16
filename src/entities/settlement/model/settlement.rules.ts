import type { SettlementItem } from './settlement'

/** 정산 예정 금액: 아직 정산 안 된 구매확정분 판매 금액 합 (수수료 빼기 전) */
export function sumSettlementItems(items: SettlementItem[]): number {
  return items.reduce((sum, item) => sum + item.amount, 0)
}
