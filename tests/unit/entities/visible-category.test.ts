import { describe, expect, it } from 'vitest'
import { visibleCategoryIdOf } from '@/entities/product'

const categories = [
  { id: '11', name: '상의', path: '의류 > 상의' },
  { id: '12', name: '바지', path: '의류 > 바지' },
]

// 골라 둔 카테고리(주소 ?cat=)가 고른 자녀에게 보이는 목록에 없으면(남아로 바꿨는데 치마) 카테고리 거르기를 푼다
describe('visibleCategoryIdOf: 보이는 카테고리만 거르기에 남긴다', () => {
  it.each([
    ['12', categories, '12'],
    ['13', categories, null],
    [null, categories, null],
    ['13', undefined, '13'],
  ])('고른 %s · 목록 %j → %s', (categoryId, list, expected) => {
    expect(visibleCategoryIdOf(categoryId, list)).toBe(expected)
  })
})
