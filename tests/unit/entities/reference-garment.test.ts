import { describe, expect, it } from 'vitest'
import {
  categoriesForPart,
  garmentPartOf,
  isValidMeasurementText,
  toReferenceGarment,
  toReferenceGarmentFromPurchase,
  toReferenceGarmentForm,
  toReferenceGarmentRequest,
  validateReferenceGarmentForm,
  type ReferenceGarmentForm,
} from '@/entities/recommendation'

// 추천 기준 옷: 자녀별 상의 · 바지 · 아우터 · 원피스 · 치마 한 벌씩. 상의 · 아우터는 총장 · 가슴단면 필수,
// 어깨너비 · 소매길이 선택. 원피스는 총장 · 가슴단면 필수, 어깨너비 선택. 바지는 총장 · 허리단면 필수, 밑위 선택.
// 치마는 총장 · 허리단면 필수, 엉덩이단면 선택. 값은 cm, 0 초과 200 이하, 소수 첫째 자리까지

describe('기준 옷 구분과 카테고리', () => {
  it.each([
    ['의류 > 상의', 'TOP'],
    ['의류 > 상의 > 티셔츠', 'TOP'],
    ['의류 > 아우터', 'OUTER'],
    ['원피스', 'DRESS'],
    ['의류 > 하의', 'BOTTOM'],
    ['의류 > 바지', 'BOTTOM'],
    ['의류 > 치마', 'SKIRT'],
    ['잡화 > 모자', null],
    ['의류 > 상의세트', null],
  ])('카테고리 경로 %s의 구분은 %s다', (path, expected) => {
    expect(garmentPartOf(path)).toBe(expected)
  })

  it('구분에 맞는 카테고리만 고를 수 있다', () => {
    const categories = [
      { id: '11', name: '상의', path: '의류 > 상의' },
      { id: '12', name: '하의', path: '의류 > 하의' },
      { id: '13', name: '아우터', path: '의류 > 아우터' },
      { id: '14', name: '모자', path: '잡화 > 모자' },
    ]
    expect(categoriesForPart('TOP', categories).map((c) => c.id)).toEqual(['11'])
    expect(categoriesForPart('OUTER', categories).map((c) => c.id)).toEqual(['13'])
    expect(categoriesForPart('BOTTOM', categories).map((c) => c.id)).toEqual(['12'])
  })
})

describe('실측 값 입력', () => {
  it.each(['0.1', '42', '34.5', '200', ' 42 '])('%s는 받는다', (text) => {
    expect(isValidMeasurementText(text)).toBe(true)
  })

  it.each(['0', '200.1', '34.55', '-1', 'abc', '', '1e2'])('%s는 거절한다', (text) => {
    expect(isValidMeasurementText(text)).toBe(false)
  })
})

describe('기준 옷 저장 폼 검사', () => {
  const top: ReferenceGarmentForm = {
    categoryId: '11',
    measurements: {
      TOTAL_LENGTH: '42',
      CHEST_WIDTH: '34.5',
      SHOULDER_WIDTH: '',
      SLEEVE_LENGTH: '',
    },
  }

  it('필수 실측이 있고 값이 맞으면 통과한다 (선택은 비워도 된다)', () => {
    expect(validateReferenceGarmentForm('TOP', top)).toBeNull()
  })

  it.each([
    [{ ...top, categoryId: '' }, '세부 종류를 골라 주세요.'],
    [
      { ...top, measurements: { ...top.measurements, CHEST_WIDTH: ' ' } },
      '가슴단면은 꼭 입력해 주세요.',
    ],
    [
      { ...top, measurements: { ...top.measurements, SLEEVE_LENGTH: '0' } },
      '실측 값은 0cm보다 크고 200cm 이하로, 소수 첫째 자리까지 입력해 주세요.',
    ],
  ])('막는 경우 (%#)', (form, message) => {
    expect(validateReferenceGarmentForm('TOP', form)).toBe(message)
  })

  it('치마는 허리단면이 필수이고 엉덩이단면은 비워도 된다', () => {
    expect(
      validateReferenceGarmentForm('SKIRT', {
        categoryId: '15',
        measurements: { TOTAL_LENGTH: '35', WAIST_WIDTH: '', HIP_WIDTH: '' },
      }),
    ).toBe('허리단면은 꼭 입력해 주세요.')
    expect(
      validateReferenceGarmentForm('SKIRT', {
        categoryId: '15',
        measurements: { TOTAL_LENGTH: '35', WAIST_WIDTH: '24', HIP_WIDTH: '' },
      }),
    ).toBeNull()
  })

  it('하의는 허리단면이 필수다', () => {
    expect(
      validateReferenceGarmentForm('BOTTOM', {
        categoryId: '12',
        measurements: { TOTAL_LENGTH: '60', WAIST_WIDTH: '', RISE: '' },
      }),
    ).toBe('허리단면은 꼭 입력해 주세요.')
  })
})

describe('기준 옷 변환', () => {
  it('응답의 실측은 구분의 순서(필수 → 선택)로 보여 준다 (키 순서는 보장되지 않는다)', () => {
    expect(
      toReferenceGarment({
        part: 'TOP',
        categoryId: '7',
        measurements: { SLEEVE_LENGTH: 30, CHEST_WIDTH: 34.5, TOTAL_LENGTH: 42.0 },
      }),
    ).toEqual({
      part: 'TOP',
      categoryId: '7',
      measurements: [
        { code: 'TOTAL_LENGTH', label: '총장', value: 42 },
        { code: 'CHEST_WIDTH', label: '가슴단면', value: 34.5 },
        { code: 'SLEEVE_LENGTH', label: '소매길이', value: 30 },
      ],
    })
  })

  it('저장한 기준 옷으로 폼을 채운다 (없는 실측은 빈칸)', () => {
    expect(
      toReferenceGarmentForm('BOTTOM', {
        part: 'BOTTOM',
        categoryId: '12',
        measurements: [{ code: 'WAIST_WIDTH', label: '허리단면', value: 25 }],
      }),
    ).toEqual({ categoryId: '12', measurements: { TOTAL_LENGTH: '', WAIST_WIDTH: '25', RISE: '' } })
  })

  it('저장한 기준 옷이 없으면 빈 폼', () => {
    expect(toReferenceGarmentForm('BOTTOM', null)).toEqual({
      categoryId: '',
      measurements: { TOTAL_LENGTH: '', WAIST_WIDTH: '', RISE: '' },
    })
  })

  it('요청에는 입력한 실측만 숫자로 싣는다 (뺀 선택 실측은 사라진다)', () => {
    expect(
      toReferenceGarmentRequest({
        categoryId: '7',
        measurements: {
          TOTAL_LENGTH: ' 42 ',
          CHEST_WIDTH: '34.5',
          SHOULDER_WIDTH: '',
          SLEEVE_LENGTH: '',
        },
      }),
    ).toEqual({ categoryId: '7', measurements: { TOTAL_LENGTH: 42, CHEST_WIDTH: 34.5 } })
  })
})

describe('산 옷에서 기준 옷 채우기', () => {
  const spec = (size: string, values: Record<string, number | null>) => ({
    size,
    measurements: Object.entries(values).map(([code, value]) => ({ code, value })),
  })
  const sizeSpecs = [
    spec('110', { TOTAL_LENGTH: 42, CHEST_WIDTH: 34.5, SLEEVE_LENGTH: null, NECK_WIDTH: 12 }),
    spec('120', { TOTAL_LENGTH: 45, CHEST_WIDTH: 36 }),
  ]

  it('카테고리로 구분을 정하고, 산 사이즈의 실측 중 그 구분의 항목만 채운다', () => {
    expect(
      toReferenceGarmentFromPurchase(
        { categoryId: '11', categoryPath: '의류 > 상의', sizeSpecs },
        '110',
      ),
    ).toEqual({
      part: 'TOP',
      form: {
        categoryId: '11',
        measurements: {
          TOTAL_LENGTH: '42',
          CHEST_WIDTH: '34.5',
          SHOULDER_WIDTH: '',
          SLEEVE_LENGTH: '',
        },
      },
    })
  })

  it.each([
    [{ categoryId: '14', categoryPath: '잡화 > 모자', sizeSpecs }, '110'],
    [{ categoryId: '11', categoryPath: '의류 > 상의', sizeSpecs }, '130'],
  ])('기준 옷 구분이 아니거나 그 사이즈 실측이 없으면 null (%#)', (purchase, size) => {
    expect(toReferenceGarmentFromPurchase(purchase, size)).toBeNull()
  })
})
