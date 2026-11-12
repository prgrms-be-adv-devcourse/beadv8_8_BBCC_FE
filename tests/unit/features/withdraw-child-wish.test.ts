import { describe, expect, it } from 'vitest'
import { canWithdrawWish } from '@/entities/wish'

const NOW = new Date('2026-11-12T10:00:00+09:00')
const wish = (
  status: 'REQUESTED' | 'PAID' | 'REJECTED' | 'CANCELLED' | 'EXPIRED',
  expiresAt: string | null,
) => ({
  status,
  expiresAt,
})

describe('자녀 조르기 철회 (BE #968 · #1008)', () => {
  it('대기 중이고 기한 전이면 철회할 수 있다', () => {
    expect(canWithdrawWish(wish('REQUESTED', '2026-11-12T10:00:01'), NOW)).toBe(true)
  })
  it('기한이 되면(만료 처리 전이라도) 철회할 수 없다 — BE 409', () => {
    expect(canWithdrawWish(wish('REQUESTED', '2026-11-12T10:00:00'), NOW)).toBe(false)
  })
  it('만료가 꺼져 기한이 없으면 대기 중엔 철회할 수 있다', () => {
    expect(canWithdrawWish(wish('REQUESTED', null), NOW)).toBe(true)
  })
  it('처리된 조르기는 철회할 수 없다', () => {
    for (const status of ['PAID', 'REJECTED', 'CANCELLED', 'EXPIRED'] as const)
      expect(canWithdrawWish(wish(status, null), NOW)).toBe(false)
  })
})
