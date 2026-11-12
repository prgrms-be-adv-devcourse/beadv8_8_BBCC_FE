import { describe, expect, it } from 'vitest'
import { toSizeRecommendation, type SizeRecommendationDto } from '@/entities/recommendation'

// 성장 속도 · 입을 수 있는 기간 (BE #1266): 성장 속도는 늘 오고, 기간은 사이즈별(24개월 상한).
// 사이즈 무관 · 모자 · 양말이면 기간은 빈 목록, 계산할 수 없는 칸은 null

const growthSpeed = {
  cmPerMonth: 0.55,
  recentCmPerMonth: null,
  recordCount: 3,
  recordMonths: 3.46,
  childSharePercent: 40,
  tableCmPerMonth: 0.5,
  tableSource: '한국아동패널',
}

const base: SizeRecommendationDto = {
  productId: '1',
  childId: '501',
  recommendedSize: '120',
  fit: 'PROPER',
  notices: [],
  candidateSizes: ['120'],
  lastPurchasedSize: null,
  source: 'RULE',
  reasons: [],
  referenceFit: null,
  itemJudgements: [],
  wearPreview: null,
  growthSpeed,
  wearablePeriods: [],
}

describe('toSizeRecommendation: 성장 속도 · 입을 수 있는 기간', () => {
  it('성장 속도는 숫자 · 출처를 그대로 옮긴다', () => {
    expect(toSizeRecommendation(base).growthSpeed).toEqual(growthSpeed)
  })

  it.each([
    ['사이즈 무관이면', []],
    [
      '사이즈별 기간 (계산할 수 없는 칸은 null)',
      [
        { size: '110', lengthMonths: 0, widthMonths: null, months: 0 },
        { size: '120', lengthMonths: 9, widthMonths: 6, months: 6 },
        { size: '130', lengthMonths: null, widthMonths: null, months: null },
      ],
    ],
  ])('입을 수 있는 기간: %s 그대로 옮긴다', (_case, wearablePeriods) => {
    expect(toSizeRecommendation({ ...base, wearablePeriods }).wearablePeriods).toEqual(
      wearablePeriods,
    )
  })
})
