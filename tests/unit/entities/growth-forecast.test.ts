import { describe, expect, it } from 'vitest'
import { forecastGrowth, type GrowthRecord, sizeBandOf } from '@/entities/child'

const record = (recordedAt: string, heightCm: number): GrowthRecord => ({
  id: recordedAt,
  heightCm,
  bodyType: null,
  recordedAt,
})

describe('사이즈 구간 (아동복 일반 표기: 호칭 = 키)', () => {
  it('120 = 115 이상 125 미만', () => {
    expect(sizeBandOf(118)).toEqual({ size: 120, minCm: 115, maxCm: 125 })
    expect(sizeBandOf(115)).toEqual({ size: 120, minCm: 115, maxCm: 125 })
    expect(sizeBandOf(114.9)).toEqual({ size: 110, minCm: 105, maxCm: 115 })
  })
})

describe('다음 사이즈 예고 (아이 기록 추정)', () => {
  it('한 달 이상 떨어진 기록 2개 이상이면 속도와 남은 달', () => {
    // 6개월에 3cm → 한 달 0.5cm, 지금 118 → 125까지 7cm → 약 14개월
    const forecast = forecastGrowth(
      [record('2026-04-15T10:00:00', 115), record('2026-10-15T10:00:00', 118)],
      118,
    )
    expect(forecast.cmPerMonth).toBe(0.5)
    expect(forecast.monthsToNext).toBe(14)
    expect(forecast.band.size).toBe(120)
  })
  it('기록이 하나뿐이거나 한 달이 안 되면 추정하지 않는다', () => {
    expect(forecastGrowth([record('2026-10-15T10:00:00', 118)], 118).cmPerMonth).toBeNull()
    expect(
      forecastGrowth([record('2026-10-01T10:00:00', 117), record('2026-10-15T10:00:00', 118)], 118)
        .monthsToNext,
    ).toBeNull()
  })
  it('키가 줄었거나 3년 넘게 걸리면 남은 달은 null', () => {
    expect(
      forecastGrowth([record('2026-01-01', 120), record('2026-10-01', 119)], 119).monthsToNext,
    ).toBeNull()
    expect(
      forecastGrowth([record('2025-10-01', 115), record('2026-10-01', 115.5)], 115.5).monthsToNext,
    ).toBeNull()
  })
})
