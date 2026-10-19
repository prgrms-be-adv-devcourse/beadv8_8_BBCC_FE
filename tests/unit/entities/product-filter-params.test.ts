import { describe, expect, it } from 'vitest'
import {
  readProductFilters,
  readProductPage,
  writeProductFilters,
  writeProductPage,
} from '@/entities/product'
import { orderTabOf } from '@/entities/order'

describe('홈 거르기 ↔ 주소', () => {
  it('주소를 읽는다 (모르는 정렬 · 틀린 옵션 값은 버림)', () => {
    const params = new URLSearchParams('cat=11&sort=PRICE_ASC&attr=COLOR:3&attr=bad&q=조거')
    expect(readProductFilters(params)).toEqual({
      categoryId: '11',
      sort: 'PRICE_ASC',
      attributes: ['COLOR:3'],
    })
    expect(readProductFilters(new URLSearchParams('sort=WRONG'))).toEqual({ categoryId: null })
  })
  it('쓰면 다른 값(q · child)은 남기고, 기본값(최신순 · 빈 값)은 싣지 않는다', () => {
    const next = writeProductFilters(new URLSearchParams('q=조거&child=3&cat=1'), {
      categoryId: '12',
      sort: 'NEWEST',
      attributes: ['SIZE:7', 'COLOR:3'],
    })
    expect(next.toString()).toBe('q=%EC%A1%B0%EA%B1%B0&child=3&cat=12&attr=SIZE%3A7&attr=COLOR%3A3')
    expect(
      writeProductFilters(new URLSearchParams('cat=1&sort=PRICE_DESC'), {
        categoryId: null,
      }).toString(),
    ).toBe('')
  })
  it('읽고 다시 쓰면 같다', () => {
    const params = new URLSearchParams('cat=11&sort=PRICE_DESC&attr=COLOR:3')
    expect(writeProductFilters(new URLSearchParams(), readProductFilters(params)).toString()).toBe(
      params.toString(),
    )
  })
})

describe('전체 상품 페이지 ↔ 주소 (?page=, 사람이 보는 번호라 1부터)', () => {
  it.each([
    ['', 0],
    ['page=1', 0],
    ['page=3', 2],
    ['page=0', 0],
    ['page=-2', 0],
    ['page=abc', 0],
    ['page=2.5', 0],
  ])('%j → %i페이지(0부터)', (query, expected) => {
    expect(readProductPage(new URLSearchParams(query))).toBe(expected)
  })
  it('쓰면 첫 페이지는 싣지 않고, 거르기를 바꾸면 첫 페이지로 돌아간다', () => {
    expect(writeProductPage(new URLSearchParams('cat=11'), 2).toString()).toBe('cat=11&page=3')
    expect(writeProductPage(new URLSearchParams('cat=11&page=3'), 0).toString()).toBe('cat=11')
    expect(
      writeProductFilters(new URLSearchParams('q=a&page=3'), { categoryId: '12' }).toString(),
    ).toBe('q=a&cat=12')
  })
})

describe('orderTabOf: 주문 탭 (?tab=)', () => {
  it('아는 값만, 나머지는 전체', () => {
    expect(orderTabOf('PAID')).toBe('PAID')
    expect(orderTabOf('CANCELLED')).toBe('CANCELLED')
    expect(orderTabOf(null)).toBe('ALL')
    expect(orderTabOf('SHIPPING')).toBe('ALL')
  })
})
