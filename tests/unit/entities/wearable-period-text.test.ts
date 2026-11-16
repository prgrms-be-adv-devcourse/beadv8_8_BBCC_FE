import { describe, expect, it } from 'vitest'
import {
  wearablePeriodTextOf,
  type GrowthSpeed,
  type WearablePeriod,
} from '@/entities/recommendation'

// 사이즈 추천 상자의 기간 줄: 추천 사이즈를 앞으로 입을 수 있는 개월 수(24 상한)를 예상치로 쓴다.
// 성장이 0.0cm로 반올림되면 성장 0으로 계산한 값이라(「2년 이상」으로 잘못 안내) 줄을 숨긴다

const growthSpeed: GrowthSpeed = {
  cmPerMonth: 0.55,
  recentCmPerMonth: null,
  recordCount: 3,
  recordMonths: 3.5,
  childSharePercent: 40,
  tableCmPerMonth: 0.55,
  tableSource: '한국아동패널',
}

const period = (months: number | null): WearablePeriod => ({
  size: '120',
  lengthMonths: months,
  widthMonths: null,
  months,
})

const input = (
  months: number | null,
  patch: { recommendedSize?: string | null; cmPerMonth?: number } = {},
) => ({
  recommendedSize: patch.recommendedSize === undefined ? '120' : patch.recommendedSize,
  wearablePeriods: [{ ...period(3), size: '110' }, period(months)],
  growthSpeed: { ...growthSpeed, cmPerMonth: patch.cmPerMonth ?? growthSpeed.cmPerMonth },
})

describe('wearablePeriodTextOf', () => {
  it.each([
    [0, '곧 작아질 것으로 예상해요'],
    [1, '약 1개월 더 입을 수 있을 것으로 예상해요'],
    [6, '약 6개월 더 입을 수 있을 것으로 예상해요'],
    [23, '약 23개월 더 입을 수 있을 것으로 예상해요'],
    [24, '2년 이상 입을 수 있을 것으로 예상해요'],
  ])('추천 사이즈 기간 %i개월: %s', (months, text) => {
    expect(wearablePeriodTextOf(input(months))).toBe(text)
  })

  it.each([
    ['기간을 계산할 수 없으면', input(null)],
    ['추천 사이즈가 없으면', input(6, { recommendedSize: null })],
    ['추천 사이즈의 기간이 없으면', input(6, { recommendedSize: '130' })],
    ['성장이 0.0cm로 반올림되면 (0.04)', input(24, { cmPerMonth: 0.04 })],
  ])('%s 숨긴다 (null)', (_case, value) => {
    expect(wearablePeriodTextOf(value)).toBeNull()
  })

  it('성장이 0.05cm면 0.1cm로 보여 기간 줄을 남긴다', () => {
    expect(wearablePeriodTextOf(input(24, { cmPerMonth: 0.05 }))).toBe(
      '2년 이상 입을 수 있을 것으로 예상해요',
    )
  })
})
