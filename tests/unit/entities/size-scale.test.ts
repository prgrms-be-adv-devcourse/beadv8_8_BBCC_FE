import { describe, expect, it } from 'vitest'
import { sizeScaleOf } from '@/entities/recommendation'

const SIZES = [
  { size: '100', minHeightCm: 95, maxHeightCm: 105 },
  { size: '110', minHeightCm: 105, maxHeightCm: 115 },
  { size: '120', minHeightCm: 115, maxHeightCm: 125 },
  { size: '130', minHeightCm: 125, maxHeightCm: 135 },
]

describe('상품 사이즈 눈금 (사이즈마다 권장 키 칸 + 자녀 키 핀)', () => {
  it('양 끝을 2cm 넓혀 칸과 키를 % 위치로 낸다', () => {
    // 93 ~ 137 (44cm)
    const scale = sizeScaleOf(SIZES, 115)
    expect(scale.segments[0]).toEqual({ size: '100', startPct: 4.55, endPct: 27.27 })
    expect(scale.segments[3]).toEqual({ size: '130', startPct: 72.73, endPct: 95.45 })
    expect(scale.heightPct).toBe(50)
  })

  it('키가 칸 밖이면 눈금을 키까지 넓힌다', () => {
    const scale = sizeScaleOf(SIZES, 140)
    // 93 ~ 142
    expect(scale.heightPct).toBe(95.92)
  })

  it('권장 키 순서로 늘어놓는다 (응답 순서와 상관없이)', () => {
    const scale = sizeScaleOf([SIZES[2], SIZES[0], SIZES[1]], 110)
    expect(scale.segments.map((segment) => segment.size)).toEqual(['100', '110', '120'])
  })

  it('사이즈가 없으면 칸 없이 키만 가운데', () => {
    expect(sizeScaleOf([], 110)).toEqual({ segments: [], heightPct: 50 })
  })
})
