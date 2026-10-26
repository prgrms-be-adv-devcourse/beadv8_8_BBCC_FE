import { describe, expect, it } from 'vitest'
import {
  registerPreviewOf,
  toCategoryInputs,
  type CategoryInputsDto,
  type RegisterProductForm,
} from '@/entities/product'

// 의류 > 상의: 색상 · 사이즈 옵션, 사이즈가 가격을 가른다
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
      priceAffecting: true,
      values: [
        { valueId: '202', value: '110', colorCode: null },
        { valueId: '203', value: '120', colorCode: null },
      ],
    },
  ],
  measurementItems: [],
}
const inputs = toCategoryInputs(inputsDto)
const form: RegisterProductForm = {
  name: ' 데일리 맨투맨 ',
  brand: ' 키들리 ',
  description: '',
  thumbnailUrl: 'https://cdn/thumb.jpg',
  imageUrls: [],
  categoryId: '11',
  info: {},
  optionValues: { '1': ['101', '102'], '2': ['202', '203'] },
  stocks: {},
  skuCodes: {},
  removedCombos: [],
  prices: { '202': 27000, '203': 25000 },
  sizeSpecs: {},
}

describe('registerPreviewOf: 등록 폼 → 구매자 화면 미리보기 값', () => {
  it('상품명 · 브랜드는 앞뒤 빈칸을 빼고, 카테고리 · 대표 사진을 그대로 싣는다', () => {
    const preview = registerPreviewOf(inputs, form)
    expect(preview.name).toBe('데일리 맨투맨')
    expect(preview.brand).toBe('키들리')
    expect(preview.categoryName).toBe('상의')
    expect(preview.imageUrl).toBe('https://cdn/thumb.jpg')
  })

  it('가격은 가격 묶음 중 가장 싼 판매가 (구매자 목록의 「N원부터」)', () => {
    expect(registerPreviewOf(inputs, form).minPrice).toBe(25000)
  })

  it('판매가를 아직 안 넣은 묶음(0 · 없음)은 빼고, 다 비었으면 null', () => {
    expect(
      registerPreviewOf(inputs, { ...form, prices: { '202': 27000, '203': 0 } }).minPrice,
    ).toBe(27000)
    expect(registerPreviewOf(inputs, { ...form, prices: {} }).minPrice).toBeNull()
  })

  it('옵션은 항목마다 고른 값 이름 (항목 순서, 값 순서)', () => {
    expect(registerPreviewOf(inputs, form).options).toEqual([
      { name: '색상', values: ['네이비', '그레이'] },
      { name: '사이즈', values: ['110', '120'] },
    ])
  })

  it('판매자가 조합을 모두 뺀 값은 옵션에서도, 가격에서도 빠진다', () => {
    const preview = registerPreviewOf(inputs, {
      ...form,
      removedCombos: ['101,203', '102,203'],
    })
    expect(preview.options[1]).toEqual({ name: '사이즈', values: ['110'] })
    expect(preview.minPrice).toBe(27000)
  })

  it('빈 상품명 · 브랜드는 null, 값을 안 고른 항목은 빈 목록', () => {
    const preview = registerPreviewOf(inputs, {
      ...form,
      name: '  ',
      brand: '',
      optionValues: { '1': ['101'] },
    })
    expect(preview.name).toBeNull()
    expect(preview.brand).toBeNull()
    expect(preview.options).toEqual([
      { name: '색상', values: ['네이비'] },
      { name: '사이즈', values: [] },
    ])
  })
})
