import { describe, expect, it } from 'vitest'
import { settlementPeriodEnd } from '@/features/run-settlement/lib/period-end'

describe('정산 종료 기준일 (한국 시간 기준, 이 날짜 이전 구매확정분)', () => {
  it('기본은 오늘, 시연용은 내일 (월 · 연 넘김 포함)', () => {
    // 2026-10-15 23:30 KST = 14:30 UTC
    expect(settlementPeriodEnd(new Date('2026-10-15T14:30:00Z'), false)).toBe('2026-10-15')
    expect(settlementPeriodEnd(new Date('2026-10-15T14:30:00Z'), true)).toBe('2026-10-16')
    expect(settlementPeriodEnd(new Date('2026-12-31T03:00:00Z'), true)).toBe('2027-01-01')
  })
  it('UTC로는 전날이어도 한국 시간 날짜를 쓴다 (KST 0~9시)', () => {
    // 2026-10-16 00:19 KST = 2026-10-15 15:19 UTC
    expect(settlementPeriodEnd(new Date('2026-10-15T15:19:00Z'), true)).toBe('2026-10-17')
  })
})
