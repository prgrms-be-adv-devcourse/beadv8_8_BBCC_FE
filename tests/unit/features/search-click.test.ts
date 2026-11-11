import { describe, expect, it } from 'vitest'
import { toSearchClickRequest } from '@/features/record-search-click'

// 검색 결과 클릭 기록 (BE SearchClickRequest): rank는 보여 준 목록에서 누른 위치이고 첫 페이지 첫 상품이 1이다

const click = {
  keyword: ' 원피스 ',
  productId: '31',
  page: 0,
  size: 20,
  index: 2,
  sort: 'RELEVANCE' as const,
  childId: null,
}

describe('toSearchClickRequest', () => {
  it('검색어 공백을 지우고, 상품 ID는 숫자로, 순위는 1부터 보낸다', () => {
    expect(toSearchClickRequest(click)).toEqual({
      keyword: '원피스',
      productId: 31,
      rank: 3,
      sort: 'RELEVANCE',
    })
  })

  // 보호자가 고른 자녀 (BE SearchClickRequest.childId, 선택 · 양수 Long). 없거나 숫자가 아니면 싣지 않는다
  it.each([
    ['42', 42],
    ['1', 1],
    [null, undefined],
    ['abc', undefined],
    ['0', undefined],
  ])('고른 자녀 %s는 childId %s로 보낸다', (childId, expected) => {
    expect(toSearchClickRequest({ ...click, childId })?.childId).toBe(expected)
  })

  it.each([
    [0, 0, 1],
    [0, 19, 20],
    [2, 0, 41],
    [499, 19, 10000],
  ])('%i페이지(0부터) %i번째(0부터)는 순위 %i', (page, index, rank) => {
    expect(toSearchClickRequest({ ...click, page, index })?.rank).toBe(rank)
  })

  it.each([
    ['검색어가 비면', { keyword: '  ' }],
    ['검색어가 50자를 넘으면', { keyword: '가'.repeat(51) }],
    ['순위가 10000을 넘으면', { page: 500, index: 0 }],
    ['상품 ID가 숫자가 아니면', { productId: 'abc' }],
  ])('%s 보내지 않는다 (null)', (_case, patch) => {
    expect(toSearchClickRequest({ ...click, ...patch })).toBeNull()
  })
})
