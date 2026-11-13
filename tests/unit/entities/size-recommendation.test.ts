import { describe, expect, it } from 'vitest'
import { toSizeRecommendation } from '@/entities/recommendation'

const base = {
  productId: '1',
  childId: '501',
  recommendedSize: '120',
  fit: 'PROPER',
  notices: [],
  candidateSizes: ['110', '120'],
  lastPurchasedSize: null,
  referenceFit: null,
  itemJudgements: [],
  wearPreview: null,
  growthSpeed: {
    cmPerMonth: 0.55,
    recentCmPerMonth: null,
    recordCount: 0,
    recordMonths: 0,
    childSharePercent: 0,
    tableCmPerMonth: 0.55,
    tableSource: '한국아동패널',
  },
  wearablePeriods: [],
}

describe('toSizeRecommendation: 사이즈 추천 출처 · 근거 (BE #1162)', () => {
  it('AI 근거는 종류 · 문구를 옮기고, 글 조각 ID(sourceId)는 화면에 쓰지 않는다', () => {
    const recommendation = toSizeRecommendation({
      ...base,
      source: 'AI',
      reasons: [
        { type: 'HEIGHT', detail: '키 118cm에 120이 잘 맞아요.', sourceId: null },
        { type: 'BODY_TYPE', detail: '보통 체형이라 정사이즈를 골랐어요.', sourceId: 'chunk-7' },
      ],
    })

    expect(recommendation.source).toBe('AI')
    expect(recommendation.reasons).toEqual([
      { type: 'HEIGHT', detail: '키 118cm에 120이 잘 맞아요.' },
      { type: 'BODY_TYPE', detail: '보통 체형이라 정사이즈를 골랐어요.' },
    ])
  })

  it('규칙으로 고르면 근거는 빈 목록', () => {
    const recommendation = toSizeRecommendation({ ...base, source: 'RULE', reasons: [] })

    expect(recommendation.source).toBe('RULE')
    expect(recommendation.reasons).toEqual([])
  })

  // 지난 구매(PURCHASE, BE #1299)를 포함해 아는 종류는 그대로, 모르는 종류는 null(화면에 영어 코드를 보이지 않게)
  it.each([
    ['HEIGHT', 'HEIGHT'],
    ['GROWTH', 'GROWTH'],
    ['PURCHASE', 'PURCHASE'],
    ['WEATHER', null],
    ['', null],
    ['constructor', null],
  ])('근거 종류 %s는 %s로 옮긴다', (type, expected) => {
    const recommendation = toSizeRecommendation({
      ...base,
      source: 'AI',
      reasons: [{ type, detail: '지난번 산 바지(120)보다 총장이 1cm 길어요.', sourceId: null }],
    })

    expect(recommendation.reasons[0]?.type).toBe(expected)
  })
})
