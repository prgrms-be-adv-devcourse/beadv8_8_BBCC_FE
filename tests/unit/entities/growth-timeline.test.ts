import { describe, expect, it } from 'vitest'
import { growthTimeline, type GrowthRecord } from '@/entities/child'

const record = (id: string, recordedAt: string, heightCm: number): GrowthRecord => ({
  id,
  heightCm,
  bodyType: null,
  recordedAt,
})

describe('성장 이력 줄 (최신이 위, 바로 앞 기록보다 얼마나 컸는지)', () => {
  it('최신 순으로 늘어놓고, 바로 앞(더 오래된) 기록과의 차이를 0.1cm로 낸다', () => {
    const rows = growthTimeline([
      record('a', '2026-01-10T10:00:00', 103),
      record('c', '2026-07-10T10:00:00', 106.3),
      record('b', '2026-04-10T10:00:00', 104.5),
    ])
    expect(rows.map((row) => [row.record.id, row.changeCm])).toEqual([
      ['c', 1.8],
      ['b', 1.5],
      ['a', null],
    ])
  })

  it('키가 줄어든 기록(잘못 잰 값 등)은 음수로 둔다', () => {
    const rows = growthTimeline([
      record('a', '2026-01-10T10:00:00', 110),
      record('b', '2026-02-10T10:00:00', 109.5),
    ])
    expect(rows[0].changeCm).toBe(-0.5)
  })

  it('기록이 없으면 빈 줄', () => {
    expect(growthTimeline([])).toEqual([])
  })
})
