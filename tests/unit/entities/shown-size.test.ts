import { describe, expect, it } from 'vitest'
import { shownSizeOf, type SizeRecommendation } from '@/entities/recommendation'

const size = (source: 'AI' | 'RULE', recommendedSize: string): SizeRecommendation => ({
  recommendedSize,
  fit: 'PROPER',
  notices: [],
  candidateSizes: ['110', '120'],
  lastPurchasedSize: null,
  source,
  reasons: [],
  referenceFit: null,
  itemJudgements: [],
  wearPreview: null,
  growthSpeed: {
    cmPerMonth: 0.5,
    recentCmPerMonth: null,
    recordCount: 1,
    recordMonths: 0,
    childSharePercent: 0,
    tableCmPerMonth: 0.5,
    tableSource: '한국아동패널',
  },
  wearablePeriods: [],
})
const rule = size('RULE', '110')
const ai = size('AI', '120')

// 사이즈 추천 SSE에서 그릴 결과: 받은 것 중 마지막 AI, 없으면 마지막 규칙 결과.
// 처음 묻는 요청은 rule → ai, 저장된 답이면 ai만, AI를 쓸 수 없으면 rule만 오고 닫힌다
describe('shownSizeOf: 사이즈 추천 SSE에서 그릴 결과', () => {
  it.each<[string, SizeRecommendation[], SizeRecommendation]>([
    ['rule → ai', [rule, ai], ai],
    ['ai만 (저장된 답)', [ai], ai],
    ['rule만 (AI를 쓸 수 없음)', [rule], rule],
  ])('%s', (_, received, expected) => {
    expect(shownSizeOf(received)).toBe(expected)
  })
})
