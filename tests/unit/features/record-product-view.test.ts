import { describe, expect, it } from 'vitest'
import { toProductViewRequest } from '@/features/record-product-view'
import { domainOf } from '@/widgets/api-flow-panel/config/domain-flow'

describe('toProductViewRequest: 상세 진입 기록 요청 (BE productId · childId)', () => {
  it.each([
    ['7', '501', { productId: '7', childId: '501' }],
    ['7', null, { productId: '7' }],
  ])('상품 %s · 자녀 %s → %j (자녀를 고르지 않으면 칸을 뺀다)', (productId, childId, expected) => {
    expect(toProductViewRequest(productId, childId)).toEqual(expected)
  })
})

describe('추천 API는 흐름도의 추천 도메인으로 잇는다', () => {
  it.each([
    '/recommendations/product-views',
    '/recommendations/size?productId=7&childId=501',
    '/recommendations/products?childId=501',
  ])('%s → recommend', (path) => {
    expect(domainOf(path)).toBe('recommend')
  })
})
