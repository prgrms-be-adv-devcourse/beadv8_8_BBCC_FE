import { describe, expect, it } from 'vitest'
import { sizeRulerOf } from '@/entities/child'

describe('키 눈금자 (추천 사이즈 구간 위에 아이 키를 놓는다)', () => {
  it('키 115 → 120 사이즈(115~125), 눈금은 사이즈 ±20cm, 여유 10cm', () => {
    expect(sizeRulerOf(115)).toEqual({
      heightCm: 115,
      band: { size: 120, minCm: 115, maxCm: 125 },
      fromCm: 100,
      toCm: 140,
      marks: [100, 110, 120, 130, 140],
      heightPct: 37.5,
      bandStartPct: 37.5,
      bandEndPct: 62.5,
      roomCm: 10,
    })
  })

  it('여유는 소수 첫째 자리까지 (구간 끝에 가까우면 작아진다)', () => {
    expect(sizeRulerOf(118.4).roomCm).toBe(6.6)
    expect(sizeRulerOf(124.9).roomCm).toBe(0.1)
  })

  it('작은 키도 구간 기준으로 눈금을 잡는다 (85 → 90 사이즈, 70~110)', () => {
    const ruler = sizeRulerOf(85)
    expect(ruler.fromCm).toBe(70)
    expect(ruler.toCm).toBe(110)
    expect(ruler.heightPct).toBe(37.5)
  })
})
