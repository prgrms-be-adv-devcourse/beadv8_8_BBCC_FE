import { describe, expect, it } from 'vitest'
import {
  canBeOption,
  toProductType,
  toProductTypeCreateRequest,
  validateProductTypeForm,
  type Attribute,
  type ProductTypeDto,
  type ProductTypeForm,
  type ProductTypeLinkForm,
} from '@/entities/catalog'
import { productTypeShape } from '@/entities/catalog/api/catalog.shape'
import { validate } from '@/shared/api'

// 상품 유형 규칙은 BE 도메인(ProductType.define) 검사와 같은 순서 · 뜻의 문구로 미리 막는다

const attributes: Attribute[] = [
  { id: '1', name: '색상', code: 'COLOR', inputType: 'PALETTE', values: [] },
  { id: '2', name: '사이즈', code: 'SIZE', inputType: 'LIST', values: [] },
  { id: '3', name: '소재', code: 'MATERIALS', inputType: 'MULTI_LIST', values: [] },
  { id: '4', name: '혼용률', code: 'FABRIC_COMPOSITION', inputType: 'TEXT', values: [] },
]
const link = (
  attributeId: string,
  patch: Partial<ProductTypeLinkForm> = {},
): ProductTypeLinkForm => ({
  attributeId,
  role: 'OPTION',
  required: true,
  allValuesAllowed: true,
  sizeRole: false,
  priceAffecting: false,
  allowedValueIds: [],
  ...patch,
})
const form = (links: ProductTypeLinkForm[], name = '의류'): ProductTypeForm => ({ name, links })
const sizeOption = link('2', { sizeRole: true })

describe('canBeOption: 옵션 항목은 값을 하나 고르는 팔레트 · 목록만', () => {
  it.each([
    ['PALETTE', true],
    ['LIST', true],
    ['MULTI_LIST', false],
    ['TEXT', false],
  ] as const)('%s → %s', (inputType, expected) => {
    expect(canBeOption(inputType)).toBe(expected)
  })
})

describe('validateProductTypeForm', () => {
  it('필수 옵션 · 사이즈 역할 하나 · 정보 항목이 맞으면 통과한다', () => {
    const links = [link('1'), sizeOption, link('3', { role: 'INFO' }), link('4', { role: 'INFO' })]
    expect(validateProductTypeForm(form(links), attributes)).toBeNull()
  })

  it.each([
    ['이름이 비면', form([sizeOption], ' '), '유형 이름을 입력해 주세요.'],
    [
      '같은 항목을 두 번 연결하면',
      form([link('1'), link('1')]),
      '같은 항목을 두 번 연결할 수 없어요.',
    ],
    [
      '필수 옵션 항목이 없으면',
      form([link('1', { required: false }), link('4', { role: 'INFO' })]),
      '필수 옵션 항목을 하나 이상 연결해 주세요.',
    ],
    [
      '사이즈 역할이 둘이면',
      form([sizeOption, link('1', { sizeRole: true })]),
      '사이즈 역할은 항목 하나에만 둘 수 있어요.',
    ],
    [
      '정보 항목에 사이즈 역할이 있으면',
      form([link('1'), link('2', { role: 'INFO', sizeRole: true })]),
      '사이즈 역할은 옵션 항목에만 둘 수 있어요.',
    ],
    [
      '정보 항목에 가격 구분이 있으면',
      form([link('1'), link('2', { role: 'INFO', priceAffecting: true })]),
      '가격 구분은 옵션 항목에만 둘 수 있어요.',
    ],
    [
      '여러 개 고름 · 직접 입력 항목을 옵션으로 두면',
      form([link('1'), link('3')]),
      '옵션 항목에는 값을 하나 고르는 팔레트나 목록 항목만 연결해 주세요.',
    ],
    [
      '모든 값 허용이 아닌데 허용 값이 없으면',
      form([link('1', { allValuesAllowed: false })]),
      '모든 값을 허용하지 않는 항목에는 허용 값을 하나 이상 골라 주세요.',
    ],
  ])('%s 거절한다', (_case, input, message) => {
    expect(validateProductTypeForm(input, attributes)).toBe(message)
  })

  it('직접 입력 항목은 허용 값 없이 모든 값 허용을 꺼도 된다', () => {
    const links = [link('1'), link('4', { role: 'INFO', allValuesAllowed: false })]
    expect(validateProductTypeForm(form(links), attributes)).toBeNull()
  })
})

describe('상품 유형 매퍼', () => {
  it('폼 → 요청: 이름 공백을 지우고, 모든 값 허용이면 허용 값을 빈 목록으로 보낸다', () => {
    const request = toProductTypeCreateRequest(
      form(
        [
          link('1', { allowedValueIds: ['11'] }),
          link('2', { allValuesAllowed: false, allowedValueIds: ['21', '22'] }),
        ],
        ' 의류 ',
      ),
    )
    expect(request).toEqual({
      name: '의류',
      attributes: [
        {
          attributeId: '1',
          role: 'OPTION',
          required: true,
          allValuesAllowed: true,
          sizeRole: false,
          priceAffecting: false,
          allowedValueIds: [],
        },
        {
          attributeId: '2',
          role: 'OPTION',
          required: true,
          allValuesAllowed: false,
          sizeRole: false,
          priceAffecting: false,
          allowedValueIds: ['21', '22'],
        },
      ],
    })
  })

  // BE ProductTypeResponse 응답 예
  const dto: ProductTypeDto = {
    productTypeId: '1',
    name: '의류',
    attributes: [
      {
        attributeId: '1',
        code: 'COLOR',
        name: '색상',
        inputType: 'PALETTE',
        role: 'OPTION',
        required: true,
        allValuesAllowed: false,
        sizeRole: false,
        priceAffecting: false,
        allowedValues: [{ valueId: '3', name: '오트밀', colorCode: '#e3d3bc' }],
      },
    ],
  }

  it('응답 → 모델: 연결 순서를 지키고 허용 값의 ID를 id로 옮긴다', () => {
    expect(toProductType(dto)).toEqual({
      id: '1',
      name: '의류',
      links: [
        {
          attributeId: '1',
          code: 'COLOR',
          name: '색상',
          inputType: 'PALETTE',
          role: 'OPTION',
          required: true,
          allValuesAllowed: false,
          sizeRole: false,
          priceAffecting: false,
          allowedValues: [{ id: '3', name: '오트밀', colorCode: '#e3d3bc' }],
        },
      ],
    })
  })

  it('응답 예는 응답 모양과 맞고, 정해지지 않은 역할은 어긋남으로 드러난다', () => {
    expect(validate(dto, productTypeShape)).toEqual([])
    const wrongRole = { ...dto, attributes: [{ ...dto.attributes[0], role: 'BOTH' }] }
    expect(validate(wrongRole, productTypeShape).map((issue) => issue.path)).toEqual([
      'attributes[0].role',
    ])
  })
})
