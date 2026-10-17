import { describe, expect, it } from 'vitest'
import { settlementPeriodEnd } from '@/features/run-settlement/lib/period-end'

describe('정산 종료 기준일 = 오늘 (한국 시간, BE는 오늘 이후를 거절)', () => {
  it('한국 시간 오늘 날짜', () => {
    // 2026-10-15 23:30 KST = 14:30 UTC
    expect(settlementPeriodEnd(new Date('2026-10-15T14:30:00Z'))).toBe('2026-10-15')
    expect(settlementPeriodEnd(new Date('2026-12-31T03:00:00Z'))).toBe('2026-12-31')
  })
  it('UTC로는 전날이어도 한국 시간 날짜를 쓴다 (KST 0~9시)', () => {
    // 2026-10-16 00:19 KST = 2026-10-15 15:19 UTC
    expect(settlementPeriodEnd(new Date('2026-10-15T15:19:00Z'))).toBe('2026-10-16')
  })
})
