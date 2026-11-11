/** 재고 적음 기준 (이하면 판매자 화면에서 강조). BE 판매자 목록의 재고 적음 옵션(1 ~ 5)과 같다 */
const LOW_STOCK_MAX = 5

/** 옵션 재고 상태: 판매 중지 · 품절(0) · 적음(1 ~ 5) · 충분 */
export type OptionStockState = 'STOPPED' | 'OUT' | 'LOW' | 'OK'

/** 판매 중지 옵션은 수량과 상관없이 「판매 중지」 (품절로 세지 않는다) */
export function optionStockStateOf(option: { stock: number; onSale: boolean }): OptionStockState {
  if (!option.onSale) return 'STOPPED'
  if (option.stock <= 0) return 'OUT'
  if (option.stock <= LOW_STOCK_MAX) return 'LOW'
  return 'OK'
}

/** 상세 「재고 확인」: 판매 중 옵션만 품절 · 재고 적음으로 센다 */
export function summarizeOptionStock(options: { stock: number; onSale: boolean }[]): {
  soldOut: number
  lowStock: number
} {
  const states = options.map(optionStockStateOf)
  return {
    soldOut: states.filter((state) => state === 'OUT').length,
    lowStock: states.filter((state) => state === 'LOW').length,
  }
}

export type StockTag = { kind: 'OUT' | 'LOW'; count: number }

/** 목록 줄의 「품절 n」 · 「재고 적음 n」: 판매 중 상품만, 0이면 숨긴다 (서버가 센 옵션 수) */
export function sellerProductStockTagsOf(product: {
  status: string
  soldOutOptionCount: number
  lowStockOptionCount: number
}): StockTag[] {
  if (product.status !== 'ON_SALE') return []
  const tags: StockTag[] = [
    { kind: 'OUT', count: product.soldOutOptionCount },
    { kind: 'LOW', count: product.lowStockOptionCount },
  ]
  return tags.filter((tag) => tag.count > 0)
}
