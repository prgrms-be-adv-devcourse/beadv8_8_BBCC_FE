import { describe, expect, it } from 'vitest'
import { domainOf } from '@/widgets/api-flow-panel/config/domain-flow'

// 검색 결과 클릭 기록은 상품 목록(검색)과 같은 상품 도메인에 그린다 (BE search 서비스, 이벤트만 남기고 받는 쪽은 아직 없음)
describe('검색 결과 클릭 기록 흐름', () => {
  it('POST /search/clicks는 상품 도메인', () => {
    expect(domainOf('/search/clicks')).toBe('product')
  })
})
