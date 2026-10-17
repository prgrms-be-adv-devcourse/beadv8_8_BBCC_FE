import { describe, expect, it } from 'vitest'
import { toMeasurementItem, toMeasurementItemRequest } from '@/entities/catalog'
import { measurementItemShape } from '@/entities/catalog/api/catalog.shape'
import { validate } from '@/shared/api'

// BE MeasurementItemResponse (#405) 응답 예
const measurementDto = { measurementItemId: '3', name: '총장', code: 'TOTAL_LENGTH', unit: 'cm' }

describe('실측 항목 응답 ↔ 모델', () => {
  it('응답의 measurementItemId를 id로 옮긴다', () => {
    expect(toMeasurementItem(measurementDto)).toEqual({
      id: '3',
      name: '총장',
      code: 'TOTAL_LENGTH',
      unit: 'cm',
    })
  })

  it('폼 → 요청은 앞뒤 공백을 지운다', () => {
    expect(toMeasurementItemRequest({ name: ' 총장', code: 'TOTAL_LENGTH ', unit: ' cm' })).toEqual(
      { name: '총장', code: 'TOTAL_LENGTH', unit: 'cm' },
    )
  })
})

describe('응답 모양 (계약 검사)', () => {
  it('BE 응답 예는 모양과 맞는다', () => {
    expect(validate(measurementDto, measurementItemShape)).toEqual([])
  })

  it('숫자 ID · 빠진 단위는 어긋남으로 드러난다', () => {
    const issues = validate(
      { measurementItemId: 3, name: '총장', code: 'TOTAL_LENGTH' },
      measurementItemShape,
    )
    expect(issues.map((issue) => issue.path)).toEqual(['measurementItemId', 'unit'])
  })
})
