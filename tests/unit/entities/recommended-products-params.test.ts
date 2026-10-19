import { describe, expect, it } from 'vitest'
import { toRecommendedProductsParams } from '@/entities/recommendation'

describe('toRecommendedProductsParams: 맞춤 목록 요청 (BE categoryId · page · size)', () => {
  it.each([
    [{}, { page: 0, size: 20 }],
    [
      { categoryId: null, page: 2, size: 4 },
      { page: 2, size: 4 },
    ],
    [
      { categoryId: '11', page: 1 },
      { categoryId: '11', page: 1, size: 20 },
    ],
  ])('%j → %j (카테고리가 없으면 보내지 않는다)', (query, expected) => {
    expect(toRecommendedProductsParams(query)).toEqual(expected)
  })
})
