import { describe, expect, it } from 'vitest'
import {
  optionCombos,
  priceGroups,
  sizeValues,
  toCategoryInputs,
  toProductDetail,
  toRegisterProductRequest,
  validateRegisterProductForm,
  type CategoryInputsDto,
  type ProductDetailDto,
  type RegisterProductForm,
} from '@/entities/product'

// BE 테스트 픽스처(의류 > 상의)와 같은 입력 항목
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
      values: [{ valueId: '301', value: '면', colorCode: null }],
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

const form: RegisterProductForm = {
  name: ' 데일리 맨투맨 ',
  brand: '',
  imageUrls: ['https://cdn/a-1.jpg', 'https://cdn/a-2.jpg'],
  categoryId: '11',
  info: { '3': { valueId: '301', text: '' }, '4': { valueId: '', text: ' ' } },
  optionValues: { '1': ['101'], '2': ['202', '203'] },
  stocks: { '101,202': 10, '101,203': 0 },
  prices: { '': 25000 },
  sizeSpecs: {
    '202': {
      minHeightCm: 105,
      maxHeightCm: 115,
      measurements: { TOTAL_LENGTH: 42, CHEST_WIDTH: 34 },
    },
    '203': {
      minHeightCm: 115,
      maxHeightCm: 125,
      measurements: { TOTAL_LENGTH: 45, CHEST_WIDTH: 36 },
    },
  },
}

describe('등록 폼 구성 (BE CategoryInputsResponse)', () => {
  it('옵션 항목 · 정보 항목을 나눈다', () => {
    expect(inputs.optionAttributes.map((a) => a.code)).toEqual(['COLOR', 'SIZE'])
    expect(inputs.infoAttributes.map((a) => a.code)).toEqual([
      'MAIN_MATERIAL',
      'FABRIC_COMPOSITION',
    ])
  })
  it('옵션 = 고른 값의 모든 조합 (항목 순서), 가격 구분 항목이 없으면 가격 묶음 하나', () => {
    expect(optionCombos(inputs, form).map((c) => c.label)).toEqual(['네이비 / 110', '네이비 / 120'])
    expect(priceGroups(inputs, form)).toEqual([{ key: '', valueIds: [], label: '전체 옵션' }])
    expect(sizeValues(inputs, form).map((v) => v.name)).toEqual(['110', '120'])
  })
  it('값을 안 고른 옵션 항목이 있으면 옵션이 없다', () => {
    expect(optionCombos(inputs, { ...form, optionValues: { '1': ['101'] } })).toEqual([])
  })
})

describe('toRegisterProductRequest (BE ProductRegisterRequest)', () => {
  it('categoryId는 숫자, 이미지 첫 줄이 대표, 빈 정보 항목은 뺀다', () => {
    const request = toRegisterProductRequest(inputs, form)
    expect(request).toMatchObject({
      name: '데일리 맨투맨',
      brand: null,
      categoryId: 11,
      thumbnailUrl: 'https://cdn/a-1.jpg',
      imageUrls: ['https://cdn/a-1.jpg', 'https://cdn/a-2.jpg'],
      attributes: [{ attributeId: 3, valueIds: [301], text: null }],
      options: [
        { valueIds: [101, 202], initialQuantity: 10, skuCode: null },
        { valueIds: [101, 203], initialQuantity: 0, skuCode: null },
      ],
      prices: [{ valueIds: [], price: 25000 }],
    })
    expect(request.sizeSpecs[0]).toEqual({
      sizeValueId: 202,
      minHeightCm: 105,
      maxHeightCm: 115,
      measurements: { TOTAL_LENGTH: 42, CHEST_WIDTH: 34 },
    })
  })
})

describe('validateRegisterProductForm: 판매 시작 조건과 같은 기준', () => {
  it('정상 입력은 통과 (재고 0도 허용)', () => {
    expect(validateRegisterProductForm(inputs, form)).toBeNull()
  })
  it('필수 정보 항목 · 옵션 값 · 판매가', () => {
    expect(validateRegisterProductForm(inputs, { ...form, info: {} })).toBe(
      '주요소재을(를) 입력해 주세요.',
    )
    expect(
      validateRegisterProductForm(inputs, { ...form, optionValues: { '1': [], '2': ['202'] } }),
    ).toBe('색상을(를) 하나 이상 골라 주세요.')
    expect(validateRegisterProductForm(inputs, { ...form, prices: { '': 0 } })).toBe(
      '전체 옵션: 판매가를 입력해 주세요.',
    )
  })
  it('사이즈마다 권장 키 · 모든 실측 (FREE가 아닌 사이즈)', () => {
    const missingHeight = { ...form.sizeSpecs['202'], minHeightCm: 0 }
    expect(
      validateRegisterProductForm(inputs, {
        ...form,
        sizeSpecs: { ...form.sizeSpecs, '202': missingHeight },
      }),
    ).toBe('110: 권장 키를 입력해 주세요.')
    const missingMeasure = { ...form.sizeSpecs['203'], measurements: { TOTAL_LENGTH: 45 } }
    expect(
      validateRegisterProductForm(inputs, {
        ...form,
        sizeSpecs: { ...form.sizeSpecs, '203': missingMeasure },
      }),
    ).toBe('120: 가슴단면을(를) 입력해 주세요.')
  })
})

describe('toProductDetail (BE ProductDetailResponse)', () => {
  const dto: ProductDetailDto = {
    productId: '7',
    name: '데일리 맨투맨',
    brand: '키들리',
    categoryId: '11',
    status: 'ON_SALE',
    sizeFree: false,
    minPrice: 25000,
    imageUrls: [],
    optionAttributes: [
      {
        attributeId: '1',
        code: 'COLOR',
        name: '색상',
        values: [{ valueId: '101', value: '네이비', colorCode: '#1F2A44' }],
      },
      {
        attributeId: '2',
        code: 'SIZE',
        name: '사이즈',
        values: [
          { valueId: '202', value: '110', colorCode: null },
          { valueId: '203', value: '120', colorCode: null },
        ],
      },
    ],
    options: [
      {
        optionId: '1001',
        optionName: '네이비 / 110',
        valueIds: ['101', '202'],
        price: 25000,
        purchasable: true,
        stockStatus: 'LOW',
        stockQuantity: 3,
      },
      {
        optionId: '1002',
        optionName: '네이비 / 120',
        valueIds: ['101', '203'],
        price: 25000,
        purchasable: false,
        stockStatus: 'SOLD_OUT',
        stockQuantity: null,
      },
    ],
    productInfo: [{ code: 'MAIN_MATERIAL', name: '주요소재', value: '면' }],
    sizeSpecs: [
      { size: '110', minHeightCm: 105, maxHeightCm: 115, measurements: { TOTAL_LENGTH: 42 } },
    ],
    measurementItems: [{ code: 'TOTAL_LENGTH', name: '총장', unit: 'cm' }],
  }
  const detail = toProductDetail(dto, [{ id: '11', name: '상의', path: '의류 > 상의' }])

  it('카테고리명은 트리에서, 판매자명 · 설명은 없다', () => {
    expect(detail).toMatchObject({ id: '7', categoryName: '상의', brand: '키들리', imageUrl: null })
    expect(detail).not.toHaveProperty('sellerName')
    expect(detail).not.toHaveProperty('description')
  })
  it('옵션: 사이즈 값 · 실측의 권장 키 · 재고 표시', () => {
    expect(detail.options).toEqual([
      {
        id: '1001',
        name: '네이비 / 110',
        size: '110',
        price: 25000,
        soldOut: false,
        stockStatus: 'LOW',
        stockQuantity: 3,
        minHeightCm: 105,
        maxHeightCm: 115,
      },
      {
        id: '1002',
        name: '네이비 / 120',
        size: '120',
        price: 25000,
        soldOut: true,
        stockStatus: 'SOLD_OUT',
        stockQuantity: null,
        minHeightCm: null,
        maxHeightCm: null,
      },
    ])
  })
  it('실측은 항목 이름 · 단위와 함께', () => {
    expect(detail.sizeSpecs[0].measurements).toEqual([{ name: '총장', unit: 'cm', value: 42 }])
  })
})

describe('상품 목록 쿼리 (BE ProductListRequest)', () => {
  it('최신순은 보내지 않고, 정렬 · 옵션 값은 그대로 (20개까지)', async () => {
    const { toProductSearchParams } = await import('@/entities/product')
    expect(
      toProductSearchParams({ keyword: ' 맨투맨 ', categoryId: null, sort: 'NEWEST' }),
    ).toEqual({
      keyword: '맨투맨',
    })
    expect(
      toProductSearchParams({
        keyword: '',
        categoryId: '11',
        sort: 'PRICE_ASC',
        attributes: Array.from({ length: 25 }, (_, i) => `SIZE:${i + 1}`),
      }),
    ).toEqual({
      categoryId: '11',
      sort: 'PRICE_ASC',
      attributes: Array.from({ length: 20 }, (_, i) => `SIZE:${i + 1}`),
    })
  })
})
