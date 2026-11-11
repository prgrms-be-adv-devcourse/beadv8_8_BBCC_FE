import { describe, expect, it } from 'vitest'
import {
  sellerProductTabOf,
  toSellerProductsParams,
  toSellerProductTabSearch,
  type SellerProductTab,
} from '@/entities/product'

// 판매자 상품 목록 탭: 전체 · 판매 중 · 판매 중지 · 재고 적음. 서버가 상태 · 재고로 거르고 전체 개수를 센다.
// 재고 적음은 판매 중 상품 가운데 품절 · 재고 적은 옵션이 있는 것 (status=ON_SALE&lowStock=true)

describe('탭 → 판매자 상품 목록 요청 값', () => {
  it.each([
    ['ALL', { page: 0, size: 20 }],
    ['ON_SALE', { status: 'ON_SALE', page: 0, size: 20 }],
    ['STOPPED', { status: 'STOPPED', page: 0, size: 20 }],
    ['LOW_STOCK', { status: 'ON_SALE', lowStock: true, page: 0, size: 20 }],
  ] as [SellerProductTab, object][])('%s → %j', (tab, expected) => {
    expect(toSellerProductsParams(tab, 0, 20)).toEqual(expected)
  })

  it('쪽 번호와 크기는 그대로 싣는다 (개수만 셀 때는 size 1)', () => {
    expect(toSellerProductsParams('STOPPED', 3, 1)).toEqual({ status: 'STOPPED', page: 3, size: 1 })
  })
})

describe('주소 ↔ 탭', () => {
  it.each([
    [{ status: null, stock: null }, 'ALL'],
    [{ status: 'ON_SALE', stock: null }, 'ON_SALE'],
    [{ status: 'STOPPED', stock: null }, 'STOPPED'],
    [{ status: null, stock: 'low' }, 'LOW_STOCK'],
    [{ status: 'DELISTED', stock: null }, 'ALL'],
    [{ status: 'on_sale', stock: 'many' }, 'ALL'],
  ] as [{ status: string | null; stock: string | null }, SellerProductTab][])(
    '%j → %s (없거나 모르는 값은 전체)',
    (search, expected) => {
      expect(sellerProductTabOf(search)).toBe(expected)
    },
  )

  it.each([
    ['ALL', {}],
    ['ON_SALE', { status: 'ON_SALE' }],
    ['STOPPED', { status: 'STOPPED' }],
    ['LOW_STOCK', { stock: 'low' }],
  ] as [SellerProductTab, object][])('%s 탭은 주소에 %j', (tab, expected) => {
    expect(toSellerProductTabSearch(tab)).toEqual(expected)
  })
})
