import { describe, expect, it } from 'vitest'
import {
  canEditSaleInputs,
  existingComboStocks,
  toCategoryInputs,
  toEditableProductForm,
  toProductUpdateRequest,
  validateProductUpdateForm,
  type CategoryInputsDto,
  type SellerProductDetail,
} from '@/entities/product'

// BE 테스트 픽스처(의류 > 상의)와 같은 입력 항목. 사이즈가 가격을 가르는 경우는 priceBySize로 본다
const inputsDto: CategoryInputsDto = {
  categoryId: '11',
  categoryName: '상의',
  productTypeId: '1',
  productTypeName: '의류',
  attributes: [
    {
      attributeId: '1',
      code: 'COLOR',
      name: '색상',
      inputType: 'PALETTE',
      role: 'OPTION',
      required: true,
      sizeRole: false,
      priceAffecting: false,
      values: [
        { valueId: '101', value: '네이비', colorCode: '#1F2A44' },
        { valueId: '102', value: '그레이', colorCode: '#9CA3AF' },
      ],
    },
    {
      attributeId: '2',
      code: 'SIZE',
      name: '사이즈',
      inputType: 'LIST',
      role: 'OPTION',
      required: true,
      sizeRole: true,
      priceAffecting: false,
      values: [
        { valueId: '202', value: '110', colorCode: null },
        { valueId: '203', value: '120', colorCode: null },
      ],
    },
    {
      attributeId: '3',
      code: 'MAIN_MATERIAL',
      name: '주요소재',
      inputType: 'LIST',
      role: 'INFO',
      required: true,
      sizeRole: false,
      priceAffecting: false,
      values: [
        { valueId: '301', value: '면', colorCode: null },
        { valueId: '302', value: '폴리', colorCode: null },
      ],
    },
    {
      attributeId: '4',
      code: 'FABRIC_COMPOSITION',
      name: '혼용률',
      inputType: 'TEXT',
      role: 'INFO',
      required: false,
      sizeRole: false,
      priceAffecting: false,
      values: [],
    },
  ],
  measurementItems: [
    { code: 'TOTAL_LENGTH', name: '총장', unit: 'cm' },
    { code: 'CHEST_WIDTH', name: '가슴단면', unit: 'cm' },
  ],
}
const inputs = toCategoryInputs(inputsDto)
const priceBySize = toCategoryInputs({
  ...inputsDto,
  attributes: inputsDto.attributes.map((attribute) =>
    attribute.code === 'SIZE' ? { ...attribute, priceAffecting: true } : attribute,
  ),
})

const S3 = 'https://team04-kidly-s3.s3.ap-northeast-2.amazonaws.com/dev/products/2'

// BE 판매자 상세 (#403). 옵션의 valueIds는 항목 순서와 다르게 올 수 있다
const detail: SellerProductDetail = {
  id: '7',
  name: '데일리 맨투맨',
  status: 'SALE_PENDING',
  version: 3,
  brand: null,
  categoryId: '11',
  description: null,
  imageUrls: [`${S3}/a.jpg`, `${S3}/b.jpg`],
  attributes: [
    { attributeId: '3', valueIds: ['301'], text: null },
    { attributeId: '4', valueIds: [], text: '면 100%' },
  ],
  options: [
    {
      id: '41',
      name: '네이비 / 110',
      valueIds: ['202', '101'],
      price: 25000,
      stock: 10,
      onSale: true,
    },
    {
      id: '42',
      name: '네이비 / 120',
      valueIds: ['101', '203'],
      price: 25000,
      stock: 0,
      onSale: true,
    },
  ],
  prices: [{ valueIds: [], price: 25000 }],
  sizeSpecs: [
    {
      sizeValueId: '202',
      minHeightCm: 105,
      maxHeightCm: 115,
      measurements: { TOTAL_LENGTH: 42, CHEST_WIDTH: 34 },
    },
    { sizeValueId: '203', minHeightCm: null, maxHeightCm: null, measurements: {} },
  ],
}

describe('canEditSaleInputs: 옵션 · 가격 · 실측은 판매 시작 전에만 고친다 (BE는 그 밖에 409)', () => {
  it.each([
    ['SALE_PENDING', true],
    ['ON_SALE', false],
    ['STOPPED', false],
  ])('%s 상품은 %s', (status, expected) => {
    expect(canEditSaleInputs({ status })).toBe(expected)
  })
})

describe('toEditableProductForm: 판매자 상세 → 등록 폼 값 (수정 화면이 같은 폼을 쓴다)', () => {
  it('저장된 값으로 채운다: 조합 키는 옵션 항목 순서, 재고는 지금 수량, 비어 있는 값은 빈 칸', () => {
    expect(toEditableProductForm(inputs, detail)).toEqual({
      name: '데일리 맨투맨',
      brand: '',
      imageUrls: [`${S3}/a.jpg`, `${S3}/b.jpg`],
      categoryId: '11',
      info: { '3': { valueId: '301', text: '' }, '4': { valueId: '', text: '면 100%' } },
      optionValues: { '1': ['101'], '2': ['202', '203'] },
      stocks: { '101,202': 10, '101,203': 0 },
      prices: { '': 25000 },
      sizeSpecs: {
        '202': {
          minHeightCm: 105,
          maxHeightCm: 115,
          measurements: { TOTAL_LENGTH: 42, CHEST_WIDTH: 34 },
        },
        '203': { minHeightCm: 0, maxHeightCm: 0, measurements: {} },
      },
    })
  })

  it('가격 구분 항목이 있으면 가격 묶음 키는 그 항목의 값', () => {
    const bySize = {
      ...detail,
      prices: [
        { valueIds: ['203'], price: 27000 },
        { valueIds: ['202'], price: 25000 },
      ],
    }
    expect(toEditableProductForm(priceBySize, bySize).prices).toEqual({
      '202': 25000,
      '203': 27000,
    })
  })

  it('저장되지 않은 정보 항목은 빈 칸', () => {
    expect(toEditableProductForm(inputs, { ...detail, attributes: [] }).info).toEqual({
      '3': { valueId: '', text: '' },
      '4': { valueId: '', text: '' },
    })
  })
})

describe('existingComboStocks: 이미 있는 옵션 조합의 지금 재고 (재고는 재고 조정으로만 바꾼다)', () => {
  it('옵션마다 항목 순서로 맞춘 조합 키 → 지금 재고', () => {
    expect(existingComboStocks(inputs, detail)).toEqual({ '101,202': 10, '101,203': 0 })
  })
})

describe('validateProductUpdateForm: 보낼 값만 검사한다', () => {
  const form = toEditableProductForm(inputs, detail)
  // 판매 시작 전 상품의 203 사이즈는 권장 키 · 실측이 비어 있다
  const incompleteSize = '120: 권장 키를 입력해 주세요.'

  it.each([
    ['SALE_PENDING', incompleteSize],
    ['ON_SALE', null],
    ['STOPPED', null],
  ] as const)('%s 상품의 옵션 · 가격 · 실측 검사 결과는 %s', (status, expected) => {
    expect(validateProductUpdateForm(inputs, form, { status })).toBe(expected)
  })

  it.each(['SALE_PENDING', 'ON_SALE'] as const)(
    '%s 상품도 상품명 · 필수 정보 항목은 검사한다',
    (status) => {
      expect(validateProductUpdateForm(inputs, { ...form, name: ' ' }, { status })).toBe(
        '상품명을 입력해 주세요.',
      )
      expect(
        validateProductUpdateForm(
          inputs,
          { ...form, info: { ...form.info, '3': { valueId: '', text: '' } } },
          { status },
        ),
      ).toBe('주요소재을(를) 입력해 주세요.')
    },
  )
})

describe('toProductUpdateRequest: 수정 폼 → PUT 요청 (BE ProductUpdateRequest)', () => {
  const form = toEditableProductForm(inputs, detail)

  it('판매 시작 전이면 읽어 간 version과 옵션 · 가격 · 실측을 함께 보낸다 (설명은 받은 값 그대로)', () => {
    const request = toProductUpdateRequest(
      inputs,
      { ...form, name: ' 새 이름 ', brand: ' 키들리 ' },
      { ...detail, description: '부드러운 면' },
    )
    expect(request).toEqual({
      version: 3,
      name: '새 이름',
      brand: '키들리',
      categoryId: 11,
      description: '부드러운 면',
      thumbnailUrl: `${S3}/a.jpg`,
      imageUrls: [`${S3}/a.jpg`, `${S3}/b.jpg`],
      attributes: [
        { attributeId: 3, valueIds: [301], text: null },
        { attributeId: 4, valueIds: [], text: '면 100%' },
      ],
      options: [
        { valueIds: [101, 202], initialQuantity: 10, skuCode: null },
        { valueIds: [101, 203], initialQuantity: 0, skuCode: null },
      ],
      prices: [{ valueIds: [], price: 25000 }],
      sizeSpecs: [
        {
          sizeValueId: 202,
          minHeightCm: 105,
          maxHeightCm: 115,
          measurements: { TOTAL_LENGTH: 42, CHEST_WIDTH: 34 },
        },
        {
          sizeValueId: 203,
          minHeightCm: null,
          maxHeightCm: null,
          measurements: { TOTAL_LENGTH: 0, CHEST_WIDTH: 0 },
        },
      ],
    })
  })

  it.each(['ON_SALE', 'STOPPED'] as const)(
    '%s 상품은 옵션 · 가격 · 실측을 셋 다 null로 보낸다',
    (status) => {
      expect(toProductUpdateRequest(inputs, form, { ...detail, status })).toMatchObject({
        options: null,
        prices: null,
        sizeSpecs: null,
      })
    },
  )

  it('있던 조합은 폼 값이 아니라 상세의 지금 재고를, 새 조합은 폼의 처음 재고를 보낸다 (BE가 보낸 값으로 재고를 맞춘다)', () => {
    // 폼을 연 뒤 재고 조정으로 10 → 15가 된 상세를 다시 받았다
    const adjusted = {
      ...detail,
      options: detail.options.map((option) =>
        option.id === '41' ? { ...option, stock: 15 } : option,
      ),
    }
    const withGray = {
      ...form,
      optionValues: { ...form.optionValues, '1': ['101', '102'] },
      stocks: { ...form.stocks, '102,202': 7, '102,203': 0 },
    }
    expect(toProductUpdateRequest(inputs, withGray, adjusted).options).toEqual([
      { valueIds: [101, 202], initialQuantity: 15, skuCode: null },
      { valueIds: [101, 203], initialQuantity: 0, skuCode: null },
      { valueIds: [102, 202], initialQuantity: 7, skuCode: null },
      { valueIds: [102, 203], initialQuantity: 0, skuCode: null },
    ])
  })

  it('손대지 않은 정보 항목은 받은 값을 그대로 보낸다 (여러 값을 고른 목록 항목이 지워지지 않게)', () => {
    const multi = {
      ...detail,
      attributes: [{ attributeId: '3', valueIds: ['301', '302'], text: null }],
    }
    const request = toProductUpdateRequest(inputs, toEditableProductForm(inputs, multi), multi)
    expect(request.attributes).toEqual([{ attributeId: 3, valueIds: [301, 302], text: null }])
  })

  it('고친 정보 항목은 폼에서 고른 값으로 보낸다', () => {
    const multi = {
      ...detail,
      attributes: [{ attributeId: '3', valueIds: ['301', '302'], text: null }],
    }
    const edited = toEditableProductForm(inputs, multi)
    const request = toProductUpdateRequest(
      inputs,
      { ...edited, info: { ...edited.info, '3': { valueId: '302', text: '' } } },
      multi,
    )
    expect(request.attributes).toEqual([{ attributeId: 3, valueIds: [302], text: null }])
  })

  it('사진을 모두 빼면 대표 사진은 null, 목록은 []', () => {
    expect(toProductUpdateRequest(inputs, { ...form, imageUrls: [] }, detail)).toMatchObject({
      thumbnailUrl: null,
      imageUrls: [],
    })
  })
})
