import { describe, expect, it } from 'vitest'
import {
  productListTitle,
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
  // BE ProductListRequest.attributes: 항목코드(대문자 · 밑줄):값ID(1부터, 18자리까지). 틀리면 BE가 400이라 주소에서 버린다
  it.each([
    ['COLOR:3', true],
    ['PRODUCT_SIZE:1', true],
    ['SIZE:123456789012345678', true],
    ['SIZE:1234567890123456789', false],
    ['SIZE:0', false],
    ['SIZE:07', false],
    ['color:3', false],
    ['COLOR1:3', false],
    ['COLOR:a', false],
    [':3', false],
    ['COLOR:', false],
  ])('옵션 값 %s를 주소에서 읽는지: %s', (value, isKept) => {
    const filters = readProductFilters(new URLSearchParams({ attr: value }))
    expect(filters.attributes ?? []).toEqual(isKept ? [value] : [])
  })
  it('쓰면 다른 값(q · child)은 남기고, 기본값(그 검색어의 기본 정렬 · 빈 값)은 싣지 않는다', () => {
    // 검색어가 있으면 기본 정렬은 관련도순이다 (검색어가 없으면 최신순)
    const next = writeProductFilters(new URLSearchParams('q=조거&child=3&cat=1'), {
      categoryId: '12',
      sort: 'RELEVANCE',
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

describe('productListTitle: 목록 제목은 지금 보는 목록을 그대로 말한다', () => {
  it.each([
    ['맨투맨', null, 0, '"맨투맨" 검색 결과'],
    ['맨투맨', '상의', 2, '"맨투맨" 검색 결과'],
    ['', '원피스', 0, '원피스'],
    ['', '원피스', 2, '원피스 · 필터 2개'],
    ['', null, 0, '전체 상품'],
  ] as const)('검색어 %j · 카테고리 %j · 필터 %i개 → %s', (keyword, category, count, title) => {
    expect(productListTitle(keyword, category, count)).toBe(title)
  })
})
