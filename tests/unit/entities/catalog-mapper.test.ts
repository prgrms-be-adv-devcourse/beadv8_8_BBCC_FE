import { describe, expect, it } from 'vitest'
import {
  toAttribute,
  toAttributeCreateRequest,
  toAttributeValueRequest,
  toMeasurementItem,
  toMeasurementItemRequest,
  type AttributeDto,
} from '@/entities/catalog'
import { attributeShape, measurementItemShape } from '@/entities/catalog/api/catalog.shape'
import { validate } from '@/shared/api'

// BE AttributeResponse · MeasurementItemResponse (#405) 응답 예
const colorDto: AttributeDto = {
  attributeId: '1',
  name: '색상',
  code: 'COLOR',
  inputType: 'PALETTE',
  values: [{ valueId: '11', name: '네이비', colorCode: '#2f3e5c' }],
}
const measurementDto = { measurementItemId: '3', name: '총장', code: 'TOTAL_LENGTH', unit: 'cm' }

describe('항목 · 실측 항목 응답 → 모델', () => {
  it('항목은 ID를 id로, 목록 값은 순서대로 옮긴다', () => {
    expect(toAttribute(colorDto)).toEqual({
      id: '1',
      name: '색상',
      code: 'COLOR',
      inputType: 'PALETTE',
      values: [{ id: '11', name: '네이비', colorCode: '#2f3e5c' }],
    })
  })

  it('실측 항목', () => {
    expect(toMeasurementItem(measurementDto)).toEqual({
      id: '3',
      name: '총장',
      code: 'TOTAL_LENGTH',
      unit: 'cm',
    })
  })
})

describe('폼 → 요청', () => {
  it('팔레트 항목은 값마다 색 코드를 보내고 앞뒤 공백을 지운다', () => {
    const request = toAttributeCreateRequest({
      name: ' 색상 ',
      code: ' COLOR ',
      inputType: 'PALETTE',
      values: [{ name: ' 네이비', colorCode: '#2f3e5c ' }],
    })
    expect(request).toEqual({
      name: '색상',
      code: 'COLOR',
      inputType: 'PALETTE',
      values: [{ name: '네이비', colorCode: '#2f3e5c' }],
    })
  })

  it.each(['LIST', 'MULTI_LIST'] as const)(
    '%s 항목의 값은 색 코드를 null로 보낸다',
    (inputType) => {
      const request = toAttributeCreateRequest({
        name: '사이즈',
        code: 'SIZE',
        inputType,
        values: [{ name: '110', colorCode: '#ffffff' }],
      })
      expect(request.values).toEqual([{ name: '110', colorCode: null }])
    },
  )

  it('직접 입력 항목은 목록 값을 빈 목록으로 보낸다 (BE는 values null을 거절)', () => {
    const request = toAttributeCreateRequest({
      name: '혼용률',
      code: 'FABRIC_COMPOSITION',
      inputType: 'TEXT',
      values: [{ name: '면 100%', colorCode: '' }],
    })
    expect(request.values).toEqual([])
  })

  it.each([
    ['PALETTE', { name: '블랙', colorCode: '#222222' }],
    ['LIST', { name: '150', colorCode: null }],
  ] as const)('기존 %s 항목에 더할 값', (inputType, expected) => {
    expect(
      toAttributeValueRequest({ name: expected.name, colorCode: '#222222' }, inputType),
    ).toEqual(expected)
  })

  it('실측 항목은 앞뒤 공백을 지운다', () => {
    expect(toMeasurementItemRequest({ name: ' 총장', code: 'TOTAL_LENGTH ', unit: ' cm' })).toEqual(
      {
        name: '총장',
        code: 'TOTAL_LENGTH',
        unit: 'cm',
      },
    )
  })
})

describe('응답 모양 (계약 검사)', () => {
  it('BE 응답 예는 모양과 맞는다', () => {
    expect(validate(colorDto, attributeShape)).toEqual([])
    expect(validate(measurementDto, measurementItemShape)).toEqual([])
  })

  it('정해지지 않은 입력 방식 · 숫자 ID는 어긋남으로 드러난다', () => {
    const issues = validate({ ...colorDto, attributeId: 1, inputType: 'COLOR' }, attributeShape)
    expect(issues.map((issue) => issue.path)).toEqual(['attributeId', 'inputType'])
  })
  it('숫자 ID · 빠진 단위는 어긋남으로 드러난다', () => {
    const issues = validate(
      { measurementItemId: 3, name: '총장', code: 'TOTAL_LENGTH' },
      measurementItemShape,
    )
    expect(issues.map((issue) => issue.path)).toEqual(['measurementItemId', 'unit'])
  })
})
