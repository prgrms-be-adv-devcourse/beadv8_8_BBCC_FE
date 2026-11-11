import { describe, expect, it } from 'vitest'
import { domainOf } from '@/widgets/api-flow-panel/config/domain-flow'

// AI 추천(홈 맛보기 · 함께 사면 좋은 상품)도 추천 도메인에 그린다
describe('AI 추천 흐름', () => {
  it.each(['/recommendations/products/preview', '/recommendations/companions'])(
    '%s는 추천 도메인',
    (path) => {
      expect(domainOf(path)).toBe('recommend')
    },
  )
})
