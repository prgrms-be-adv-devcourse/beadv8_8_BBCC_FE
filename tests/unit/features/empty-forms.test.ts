import { describe, expect, it } from 'vitest'
import type { CategoryInputs } from '@/entities/product'
import { emptyRegisterForm } from '@/features/register-product'

// 운영(시연 기능 꺼짐)에서는 예시 값을 미리 채우지 않는다: 그대로 누르면 예시 상품이 공개되던 문제
const inputs = {
  categoryId: '11',
  infoAttributes: [
    {
      id: 'i1',
      code: 'MATERIAL',
      name: '주요소재',
      required: true,
      values: [{ id: 'v1', name: '면' }],
    },
    { id: 'i2', code: 'COMPOSITION', name: '혼용률', required: true, values: [] },
  ],
  optionAttributes: [
    {
      id: 'o1',
      code: 'COLOR',
      name: '색상',
      sizeRole: false,
      values: [{ id: 'c1', name: '네이비' }],
    },
    { id: 'o2', code: 'SIZE', name: '사이즈', sizeRole: true, values: [{ id: 's1', name: '110' }] },
  ],
  measurementItems: [{ code: 'TOTAL_LENGTH', name: '총장' }],
} as unknown as CategoryInputs

describe('emptyRegisterForm: 시연 기능이 꺼지면 빈 상품 등록 폼으로 시작한다', () => {
  it('이름 · 브랜드 · 설명 · 정보 항목이 비어 있다', () => {
    const form = emptyRegisterForm(inputs)
    expect(form.name).toBe('')
    expect(form.brand).toBe('')
    expect(form.description).toBe('')
    expect(form.info).toEqual({ i1: { valueId: '', text: '' }, i2: { valueId: '', text: '' } })
  })

  it('옵션 값을 고르지 않았고 재고 · 가격 · 실측도 없다', () => {
    const form = emptyRegisterForm(inputs)
    expect(form.optionValues).toEqual({ o1: [], o2: [] })
    expect(form.stocks).toEqual({})
    expect(form.prices).toEqual({})
    expect(form.sizeSpecs).toEqual({})
    expect(form.categoryId).toBe('11')
  })
})
