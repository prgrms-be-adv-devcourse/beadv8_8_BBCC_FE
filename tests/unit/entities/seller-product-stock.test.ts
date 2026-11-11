import { describe, expect, it } from 'vitest'
import {
  optionStockStateOf,
  sellerProductStockTagsOf,
  summarizeOptionStock,
} from '@/entities/product'

// 판매자 상품 상세의 재고 확인: 판매 중인 옵션만 센다. 품절은 수량 0, 재고 적음은 1 ~ 5.
// 판매 중지 옵션은 수량이 0이어도 품절이 아니라 「판매 중지」다

const option = (stock: number, onSale = true) => ({ stock, onSale })

describe('옵션 재고 상태', () => {
  it.each([
    [option(0), 'OUT'],
    [option(1), 'LOW'],
    [option(5), 'LOW'],
    [option(6), 'OK'],
    [option(0, false), 'STOPPED'],
    [option(3, false), 'STOPPED'],
  ])('%j → %s', (input, expected) => {
    expect(optionStockStateOf(input)).toBe(expected)
  })
})

describe('상세 재고 확인 요약', () => {
  it('판매 중 옵션만 품절 · 재고 적음으로 센다', () => {
    expect(
      summarizeOptionStock([option(0), option(2), option(5), option(9), option(0, false)]),
    ).toEqual({ soldOut: 1, lowStock: 2 })
  })

  it('옵션이 없거나 모두 충분하면 0', () => {
    expect(summarizeOptionStock([])).toEqual({ soldOut: 0, lowStock: 0 })
    expect(summarizeOptionStock([option(10), option(4, false)])).toEqual({
      soldOut: 0,
      lowStock: 0,
    })
  })
})

describe('목록 줄 재고 꼬리표', () => {
  const product = (status: string, soldOut: number, low: number) => ({
    status,
    soldOutOptionCount: soldOut,
    lowStockOptionCount: low,
  })

  it.each([
    [
      product('ON_SALE', 2, 3),
      [
        { kind: 'OUT', count: 2 },
        { kind: 'LOW', count: 3 },
      ],
    ],
    [product('ON_SALE', 0, 1), [{ kind: 'LOW', count: 1 }]],
    [product('ON_SALE', 0, 0), []],
    [product('STOPPED', 2, 3), []],
    [product('SALE_PENDING', 1, 0), []],
  ])('%j → %j (판매 중만, 0이면 숨김)', (input, expected) => {
    expect(sellerProductStockTagsOf(input)).toEqual(expected)
  })
})
