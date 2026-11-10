import { describe, expect, it } from 'vitest'
import { toRecommendedProductsParams } from '@/entities/recommendation'

describe('toRecommendedProductsParams: 맞춤 목록 요청 (BE categoryId · page · size · asOf)', () => {
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
    [
      { page: 1, asOf: '2026-11-11T10:20:30' },
      { page: 1, size: 20, asOf: '2026-11-11T10:20:30' },
    ],
    [
      { page: 0, asOf: null },
      { page: 0, size: 20 },
    ],
  ])('%j → %j (카테고리 · 기준 시각이 없으면 보내지 않는다)', (query, expected) => {
    expect(toRecommendedProductsParams(query)).toEqual(expected)
  })
})
