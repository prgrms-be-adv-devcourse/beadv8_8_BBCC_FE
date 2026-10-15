import { describe, expect, it } from 'vitest'
import { settlementPeriodEnd } from '@/features/run-settlement/lib/period-end'

describe('정산 종료 기준일 (이 날짜 이전 구매확정분)', () => {
  it('기본은 오늘, 시연용은 내일 (월 · 연 넘김 포함)', () => {
    expect(settlementPeriodEnd(new Date(2026, 9, 15, 23, 30), false)).toBe('2026-10-15')
    expect(settlementPeriodEnd(new Date(2026, 9, 15, 23, 30), true)).toBe('2026-10-16')
    expect(settlementPeriodEnd(new Date(2026, 11, 31), true)).toBe('2027-01-01')
  })
})
