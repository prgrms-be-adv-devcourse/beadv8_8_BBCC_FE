import { describe, expect, it } from 'vitest'
import { optionLabel } from '@/shared/lib'

describe('optionLabel: 장바구니 · 주문 줄의 옵션 표시', () => {
  it('옵션 이름이 있으면 그대로 (BE optionName)', () => {
    expect(optionLabel({ optionName: '네이비 / 110', size: '110' })).toBe('네이비 / 110')
  })

  it('옵션 이름이 없으면 사이즈 (옛 주문상품)', () => {
    expect(optionLabel({ optionName: null, size: '110' })).toBe('사이즈 110')
    expect(optionLabel({ optionName: '  ', size: '110' })).toBe('사이즈 110')
  })

  it('사이즈도 없으면(사이즈 없는 상품) 표시하지 않음', () => {
    expect(optionLabel({ optionName: null, size: null })).toBeNull()
  })
})
