import { describe, expect, it } from 'vitest'
import { forecastGrowth, sizeBandOf } from '@/entities/child'

describe('사이즈 구간 (아동복 일반 표기: 호칭 = 키)', () => {
  it('120 = 115 이상 125 미만', () => {
    expect(sizeBandOf(118)).toEqual({ size: 120, minCm: 115, maxCm: 125 })
    expect(sizeBandOf(115)).toEqual({ size: 120, minCm: 115, maxCm: 125 })
    expect(sizeBandOf(114.9)).toEqual({ size: 110, minCm: 105, maxCm: 115 })
  })
})

describe('다음 사이즈 예고 (받은 성장 속도로 계산)', () => {
  it.each([
    // 125까지 7cm ÷ 0.5
    [118, 0.5, 14],
    // 12.7개월 → 0.5 단위
    [118, 0.55, 12.5],
    // 0.2개월 → 가장 작은 값 0.5
    [124.9, 0.5, 0.5],
    // 9cm ÷ 0.25 = 36개월 (상한 포함)
    [116, 0.25, 36],
  ])('지금 키 %scm, 한 달 %scm이면 다음 사이즈까지 약 %s개월', (heightCm, cmPerMonth, months) => {
    expect(forecastGrowth(heightCm, cmPerMonth).monthsToNext).toBe(months)
  })

  it.each([
    // 37.5개월
    [116, 0.24],
    // 140개월
    [118, 0.05],
  ])(
    '지금 키 %scm, 한 달 %scm처럼 36개월을 넘으면 한참 남은 것으로 본다',
    (heightCm, cmPerMonth) => {
      expect(forecastGrowth(heightCm, cmPerMonth)).toMatchObject({
        monthsToNext: null,
        isFarAway: true,
      })
    },
  )

  it.each([0, 0.04])(
    '한 달 %scm처럼 0.0cm로 반올림되는 속도면 남은 달을 내지 않는다',
    (cmPerMonth) => {
      expect(forecastGrowth(118, cmPerMonth)).toMatchObject({
        cmPerMonth: 0,
        monthsToNext: null,
        isFarAway: false,
      })
    },
  )

  it('속도를 아직 받지 못했으면(null) 속도도 남은 달도 없다', () => {
    expect(forecastGrowth(118, null)).toMatchObject({
      band: { size: 120, minCm: 115, maxCm: 125 },
      cmPerMonth: null,
      monthsToNext: null,
      isFarAway: false,
    })
  })

  it.each([
    [0.5, 0.5],
    [0.55, 0.6],
    [0.62, 0.6],
  ])('한 달 %scm은 소수 첫째 자리 %s로 보여 준다', (cmPerMonth, shown) => {
    expect(forecastGrowth(118, cmPerMonth).cmPerMonth).toBe(shown)
  })
})
