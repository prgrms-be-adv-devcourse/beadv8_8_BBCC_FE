import { describe, expect, it } from 'vitest'
import { withObjectParticle } from '@/shared/lib'

describe('withObjectParticle: 받침에 맞춰 을/를을 붙인다', () => {
  it.each([
    ['사이즈', '사이즈를'],
    ['색상', '색상을'],
    ['주요소재', '주요소재를'],
    ['가슴단면', '가슴단면을'],
    ['길이', '길이를'],
  ])('%s → %s', (word, expected) => {
    expect(withObjectParticle(word)).toBe(expected)
  })

  it('한글로 끝나지 않으면 을(를)을 그대로 쓴다', () => {
    expect(withObjectParticle('SIZE')).toBe('SIZE을(를)')
    expect(withObjectParticle('')).toBe('을(를)')
  })
})
