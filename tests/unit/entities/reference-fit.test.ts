import { describe, expect, it } from 'vitest'
import { toSizeRecommendation, type SizeRecommendationDto } from '@/entities/recommendation'

// 기준 핏 (BE #1261): 기준 옷과 이 상품의 사이즈별 실측 차이(상품 − 기준 옷, cm)와, AI가 추천 사이즈를
// 항목별로 판단한 값. 기준 옷이 없으면 referenceFit은 null, 규칙 추천이면 itemJudgements는 빈 목록

const base: SizeRecommendationDto = {
  productId: '1',
  childId: '501',
  recommendedSize: '120',
  fit: 'PROPER',
  notices: [],
  candidateSizes: ['110', '120'],
  lastPurchasedSize: null,
  source: 'AI',
  reasons: [],
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

const fitItems = [
  {
    code: 'CHEST_WIDTH',
    garmentCm: 34,
    sizes: [
      { size: '110', productCm: 33, diffCm: -1 },
      { size: '120', productCm: 35.5, diffCm: 1.5 },
    ],
  },
]

describe('toSizeRecommendation: 기준 핏', () => {
  it.each([
    ['기준 옷이 없으면', null, null],
    [
      '같은 칸 기준 옷과 비교했으면',
      { productPart: 'TOP', comparedPart: 'TOP', items: fitItems },
      { productPart: 'TOP', comparedPart: 'TOP', items: fitItems },
    ],
    [
      '다른 칸 기준 옷으로 대신 비교했으면',
      { productPart: 'OUTER', comparedPart: 'TOP', items: fitItems },
      { productPart: 'OUTER', comparedPart: 'TOP', items: fitItems },
    ],
    [
      '칸이 다섯 값 밖이면 (이름표를 붙일 수 없어)',
      { productPart: 'HAT', comparedPart: 'TOP', items: fitItems },
      null,
    ],
  ])('%s referenceFit을 그대로 옮긴다', (_case, referenceFit, expected) => {
    expect(toSizeRecommendation({ ...base, referenceFit }).referenceFit).toEqual(expected)
  })

  it('AI의 항목별 판단은 그대로 옮기고, 규칙 추천이면 빈 목록', () => {
    const judgement = {
      code: 'CHEST_WIDTH',
      diffCm: 1.5,
      fit: 'PROPER',
      allowanceMinCm: 1,
      allowanceMaxCm: 4,
    }
    expect(toSizeRecommendation({ ...base, itemJudgements: [judgement] }).itemJudgements).toEqual([
      judgement,
    ])
    expect(toSizeRecommendation({ ...base, source: 'RULE' }).itemJudgements).toEqual([])
  })
})
