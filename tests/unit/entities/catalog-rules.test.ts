import { describe, expect, it } from 'vitest'
import {
  validateAttributeForm,
  validateAttributeValueForm,
  validateMeasurementItemForm,
  type AttributeForm,
} from '@/entities/catalog'

// 관리자 상품 기준 데이터 입력 검증. 형식은 BE 요청 검증(@Pattern)과 같게 맞춘다

const attributeForm = (patch: Partial<AttributeForm> = {}): AttributeForm => ({
  name: '색상',
  code: 'COLOR',
  inputType: 'PALETTE',
  values: [{ name: '네이비', colorCode: '#2f3e5c' }],
  ...patch,
})

describe('validateAttributeForm: 항목 만들기 폼', () => {
  it.each(['COLOR', 'MAIN_MATERIAL', '_', 'A', ' COLOR '])('코드 %s는 통과한다', (code) => {
    expect(validateAttributeForm(attributeForm({ code }))).toBeNull()
  })

  it.each(['color', 'COLOR1', 'MAIN-MATERIAL', 'CO LOR', '색상'])(
    '코드 %s는 대문자와 _만 쓰라고 거절한다',
    (code) => {
      expect(validateAttributeForm(attributeForm({ code }))).toBe(
        '코드는 대문자와 _만 쓸 수 있어요.',
      )
    },
  )

  it.each([
    [{ name: ' ' }, '항목 이름을 입력해 주세요.'],
    [{ code: '' }, '코드를 입력해 주세요.'],
  ])('필수값 %o이 비면 거절한다', (patch, message) => {
    expect(validateAttributeForm(attributeForm(patch))).toBe(message)
  })

  it('목록 값 중 잘못된 값이 있으면 그 값의 오류를 돌려준다', () => {
    const form = attributeForm({ values: [{ name: '네이비', colorCode: 'navy' }] })
    expect(validateAttributeForm(form)).toBe('색 코드는 #rrggbb 형식으로 입력해 주세요.')
  })

  it('목록 값 이름이 겹치면 거절한다 (BE는 항목 안 값 이름이 유일)', () => {
    const form = attributeForm({
      inputType: 'LIST',
      values: [
        { name: '면', colorCode: '' },
        { name: ' 면 ', colorCode: '' },
      ],
    })
    expect(validateAttributeForm(form)).toBe('목록 값 이름 「면」이 겹쳐요.')
  })

  it('직접 입력(TEXT) 항목은 목록 값을 보지 않는다', () => {
    const form = attributeForm({ inputType: 'TEXT', values: [{ name: '', colorCode: '' }] })
    expect(validateAttributeForm(form)).toBeNull()
  })
})

describe('validateAttributeValueForm: 목록 값 하나', () => {
  it.each(['#2f3e5c', '#FFFFFF', '#000000'])('팔레트 값의 색 코드 %s는 통과한다', (colorCode) => {
    expect(validateAttributeValueForm({ name: '네이비', colorCode }, 'PALETTE')).toBeNull()
  })

  it.each(['', '2f3e5c', '#2f3e5', '#2f3e5cc', '#gggggg', 'navy'])(
    '팔레트 값의 색 코드 %j는 거절한다',
    (colorCode) => {
      expect(validateAttributeValueForm({ name: '네이비', colorCode }, 'PALETTE')).toBe(
        '색 코드는 #rrggbb 형식으로 입력해 주세요.',
      )
    },
  )

  it.each(['LIST', 'MULTI_LIST'] as const)('%s 값은 색 코드를 보지 않는다', (inputType) => {
    expect(validateAttributeValueForm({ name: '110', colorCode: 'x' }, inputType)).toBeNull()
  })

  it('값 이름이 비면 거절한다', () => {
    expect(validateAttributeValueForm({ name: '  ', colorCode: '' }, 'LIST')).toBe(
      '목록 값 이름을 입력해 주세요.',
    )
  })
})

describe('validateMeasurementItemForm: 실측 항목 만들기 폼', () => {
  const form = { name: '총장', code: 'TOTAL_LENGTH', unit: 'cm' }

  it.each(['TOTAL_LENGTH', '_', 'A', ' RISE '])('코드 %j는 통과한다', (code) => {
    expect(validateMeasurementItemForm({ ...form, code })).toBeNull()
  })

  it.each(['total_length', 'LENGTH1', 'TOTAL-LENGTH', 'TOTAL LENGTH', '총장'])(
    '코드 %j는 대문자와 _만 쓰라고 거절한다',
    (code) => {
      expect(validateMeasurementItemForm({ ...form, code })).toBe(
        '코드는 대문자와 _만 쓸 수 있어요.',
      )
    },
  )

  it.each([
    [{ name: '' }, '실측 항목 이름을 입력해 주세요.'],
    [{ code: ' ' }, '코드를 입력해 주세요.'],
    [{ unit: '' }, '단위를 입력해 주세요.'],
  ])('필수값 %o이 비면 거절한다', (patch, message) => {
    expect(validateMeasurementItemForm({ ...form, ...patch })).toBe(message)
  })
})
