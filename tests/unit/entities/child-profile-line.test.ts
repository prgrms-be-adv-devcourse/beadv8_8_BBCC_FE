import { describe, expect, it } from 'vitest'
import { childProfileLine } from '@/entities/child'

describe('childProfileLine: 맞춤 목록 머리말 (키 · 체형 · 선호 핏, 없는 값은 뺀다)', () => {
  it.each([
    [
      { heightCm: 118, bodyType: 'NORMAL', preferredFit: 'LOOSE' },
      '키 118cm · 체형 보통 · 핏 여유',
    ],
    [{ heightCm: 104.5, bodyType: null, preferredFit: 'SLIM' }, '키 104.5cm · 핏 딱 맞게'],
    [{ heightCm: 120, bodyType: null, preferredFit: null }, '키 120cm'],
  ] as const)('%j → %s', (child, expected) => {
    expect(childProfileLine(child)).toBe(expected)
  })
})
