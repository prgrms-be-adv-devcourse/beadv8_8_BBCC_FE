import { describe, expect, it } from 'vitest'
import { garmentKindOf, type SizeSpec, wearFitOf } from '@/entities/product'

const spec = (measurements: Record<string, number | null>): SizeSpec => ({
  size: '120',
  minHeightCm: 115,
  maxHeightCm: 125,
  measurements: Object.entries(measurements).map(([name, value]) => ({ name, unit: 'cm', value })),
})

describe('착용 미리보기 (아동 평균 비율, 길이 비교용)', () => {
  it('실측 이름으로 상의 · 하의, 총장이 없으면 그리지 않는다', () => {
    expect(garmentKindOf(spec({ 총장: 45, 소매길이: 41 }))).toBe('top')
    expect(garmentKindOf(spec({ 총장: 70, 허리단면: 25 }))).toBe('bottom')
    expect(garmentKindOf(spec({ 가슴단면: 34 }))).toBeNull()
  })
  it('상의: 키 120cm에 총장 45 → 엉덩이를 덮음, 소매 41 → 손목까지', () => {
    // 목옆점 97.2cm - 45 = 52.2cm (엉덩이 60 · 샅 55.2 근처), 팔 42cm
    const fit = wearFitOf(spec({ 총장: 45, 소매길이: 41 }), 120)!
    expect(fit.hem).toBe('엉덩이를 덮어요')
    expect(fit.sleeve).toBe('손목까지 와요')
    expect(wearFitOf(spec({ 총장: 22, 소매길이: 30 }), 120)).toMatchObject({
      hem: '허리 위에서 끝나요 (짧아요)',
      sleeve: '손목 위에서 끝나요 (짧아요)',
    })
    expect(wearFitOf(spec({ 총장: 60, 소매길이: 50 }), 120)).toMatchObject({
      hem: '허벅지까지 내려와요 (길어요)',
      sleeve: '손등을 덮어요 (길어요)',
    })
  })
  it('하의: 허리(72cm)에서 총장만큼 → 발목 · 반바지 · 끌림', () => {
    expect(wearFitOf(spec({ 총장: 68, 허리단면: 25 }), 120)!.hem).toBe('발목까지 와요')
    expect(wearFitOf(spec({ 총장: 35, 허리단면: 25 }), 120)!.hem).toBe(
      '무릎 위에서 끝나요 (반바지)',
    )
    expect(wearFitOf(spec({ 총장: 80, 허리단면: 25 }), 120)!.hem).toBe(
      '바닥에 끌릴 수 있어요 (길어요)',
    )
  })
})
