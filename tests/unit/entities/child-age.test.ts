import { describe, expect, it } from 'vitest'
import { ageOf, growthMonths } from '@/entities/child'

describe('ageOf: 만 나이 (생일 경계)', () => {
  const today = new Date(2026, 9, 16)
  it('생일 전날 · 당일', () => {
    expect(ageOf('2019-10-17', today)).toBe(6)
    expect(ageOf('2019-10-16', today)).toBe(7)
  })
})

describe('growthMonths: 첫 기록 → 마지막 기록 개월 수', () => {
  it('2건 미만이면 null, 최소 1개월', () => {
    expect(growthMonths([{ recordedAt: '2026-10-01T00:00:00' }])).toBeNull()
    expect(
      growthMonths([{ recordedAt: '2026-10-01T00:00:00' }, { recordedAt: '2026-10-03T00:00:00' }]),
    ).toBe(1)
    expect(
      growthMonths([{ recordedAt: '2026-07-01T00:00:00' }, { recordedAt: '2026-10-01T00:00:00' }]),
    ).toBe(3)
  })
})
