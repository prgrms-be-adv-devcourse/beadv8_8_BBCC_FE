import { describe, expect, it } from 'vitest'
import {
  effectiveSort,
  readProductFilters,
  sortOptionsFor,
  toProductSearchParams,
  writeProductFilters,
} from '@/entities/product'

// 관련도순(RELEVANCE): BE는 검색어가 없으면 최신순과 같게 처리한다. 그래서 검색어가 있을 때만 고를 수 있고,
// 검색어가 있으면 기본 정렬이 관련도순이다 (없으면 최신순)

describe('정렬 고르기', () => {
  it('검색어가 있을 때만 관련도순을 맨 앞에 보여 준다', () => {
    expect(sortOptionsFor('')).toEqual(['NEWEST', 'PRICE_ASC', 'PRICE_DESC'])
    expect(sortOptionsFor('  ')).toEqual(['NEWEST', 'PRICE_ASC', 'PRICE_DESC'])
    expect(sortOptionsFor('원피스')).toEqual(['RELEVANCE', 'NEWEST', 'PRICE_ASC', 'PRICE_DESC'])
  })

  it.each([
    ['', undefined, 'NEWEST'],
    ['  ', undefined, 'NEWEST'],
    ['원피스', undefined, 'RELEVANCE'],
    ['원피스', 'NEWEST', 'NEWEST'],
    ['원피스', 'PRICE_ASC', 'PRICE_ASC'],
    ['', 'PRICE_DESC', 'PRICE_DESC'],
    ['', 'RELEVANCE', 'NEWEST'],
  ] as const)('검색어 %j · 고른 정렬 %s → %s', (keyword, sort, expected) => {
    expect(effectiveSort(keyword, sort)).toBe(expected)
  })
})

describe('정렬 ↔ 주소 (?sort=, 그 검색어의 기본값과 다를 때만 싣는다)', () => {
  it.each([
    ['', 'NEWEST', ''],
    ['', 'RELEVANCE', ''],
    ['', 'PRICE_ASC', 'sort=PRICE_ASC'],
    ['원피스', 'RELEVANCE', 'q=원피스'],
    ['원피스', 'NEWEST', 'q=원피스&sort=NEWEST'],
  ] as const)('검색어 %j에서 %s를 고르면 주소는 %j', (q, sort, expected) => {
    const params = new URLSearchParams(q ? { q } : {})
    const written = writeProductFilters(params, { categoryId: null, sort })
    expect(decodeURIComponent(written.toString())).toBe(expected)
  })

  it('주소의 최신순 · 관련도순도 읽는다 (화면이 검색어로 실제 정렬을 정한다)', () => {
    expect(readProductFilters(new URLSearchParams('q=원피스&sort=NEWEST')).sort).toBe('NEWEST')
    expect(readProductFilters(new URLSearchParams('sort=RELEVANCE')).sort).toBe('RELEVANCE')
  })
})

describe('목록 요청의 정렬 (BE GET /products sort)', () => {
  it.each([
    ['', undefined, undefined],
    ['', 'RELEVANCE', undefined],
    ['원피스', undefined, 'RELEVANCE'],
    ['원피스', 'NEWEST', undefined],
    ['원피스', 'PRICE_DESC', 'PRICE_DESC'],
  ] as const)(
    '검색어 %j · 고른 정렬 %s → sort %s (최신순은 기본값이라 보내지 않는다)',
    (keyword, sort, expected) => {
      expect(toProductSearchParams({ keyword, categoryId: null, sort }).sort).toBe(expected)
    },
  )
})
