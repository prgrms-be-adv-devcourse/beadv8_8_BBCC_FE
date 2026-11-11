import { describe, expect, it } from 'vitest'
import { shownPicksOf, type RecommendedPicks } from '@/entities/recommendation'

const card = (id: string) => ({
  id,
  name: `상품 ${id}`,
  businessName: null,
  minPrice: 10000,
  imageUrl: null,
  recommendedSize: '120',
  reason: null,
})
const rule: RecommendedPicks = { source: 'RULE', products: [card('1'), card('2')] }
const ai: RecommendedPicks = { source: 'AI', products: [card('3')] }
const empty = (source: 'AI' | 'RULE'): RecommendedPicks => ({ source, products: [] })

// 스트림이 닫힐 때까지 받은 결과(도착 순서)로 그릴 것을 고른다: AI 답이 있으면 AI, 없이 닫히면 규칙, 없으면 숨김(null)
describe('shownPicksOf: 함께 사면 · 홈 맛보기 SSE에서 그릴 결과', () => {
  it.each([
    ['rule → ai', [rule, ai], ai],
    ['ai만 (저장해 둔 AI 답)', [ai], ai],
    ['rule만 (AI 실패 · 꺼짐, SSE 구현 전 서버의 JSON 규칙 응답)', [rule], rule],
  ])('%s', (_, received, expected) => {
    expect(shownPicksOf(received)).toBe(expected)
  })

  it.each([
    ['받은 것이 없음', []],
    ['규칙 결과가 빈 목록', [empty('RULE')]],
    ['AI 결과가 빈 목록', [rule, empty('AI')]],
  ])('%s → 영역을 숨긴다', (_, received) => {
    expect(shownPicksOf(received)).toBeNull()
  })
})
