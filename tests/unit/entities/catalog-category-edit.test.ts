import { describe, expect, it } from 'vitest'
import {
  canChangeCategory,
  toCategoryChangeForm,
  toCategoryChangeRequest,
  validateCategoryChangeForm,
  type CatalogCategory,
} from '@/entities/catalog'

// 카테고리 수정: 목록에서 찾은 말단 카테고리를 폼으로 채우고, 상품 유형과 필수 실측 항목(고른 순서)을 PUT 본문으로 보낸다

const top: CatalogCategory = {
  id: '10',
  name: '상의',
  parentId: '9',
  isLeaf: true,
  productTypeId: '1',
  productTypeName: '의류',
  measurementItems: [
    { id: '7', name: '총장', code: 'TOTAL_LENGTH', unit: 'cm' },
    { id: '8', name: '어깨너비', code: 'SHOULDER_WIDTH', unit: 'cm' },
  ],
}
const clothing: CatalogCategory = {
  ...top,
  id: '9',
  name: '의류',
  parentId: null,
  isLeaf: false,
  productTypeId: null,
  productTypeName: null,
  measurementItems: [],
}

describe('카테고리 수정', () => {
  it.each([
    [top, true],
    [clothing, false],
  ])('말단만 수정할 수 있다 (%#)', (category, expected) => {
    expect(canChangeCategory(category)).toBe(expected)
  })

  it('지금 유형과 실측 항목을 지금 순서대로 폼에 채운다', () => {
    expect(toCategoryChangeForm(top)).toEqual({
      productTypeId: '1',
      measurementItemIds: ['7', '8'],
    })
  })

  it.each([
    [
      ['8', '7'],
      ['8', '7'],
    ],
    [[], []],
  ])('실측 항목 %j는 고른 순서 그대로 보낸다 (없으면 빈 목록)', (ids, expected) => {
    expect(toCategoryChangeRequest({ productTypeId: '2', measurementItemIds: ids })).toEqual({
      productTypeId: '2',
      measurementItemIds: expected,
    })
  })

  it('상품 유형을 고르지 않으면 막는다', () => {
    expect(validateCategoryChangeForm({ productTypeId: '', measurementItemIds: [] })).toBe(
      '말단 카테고리는 상품 유형을 골라 주세요.',
    )
  })

  it('상품 유형을 골랐으면 통과한다', () => {
    expect(validateCategoryChangeForm({ productTypeId: '1', measurementItemIds: [] })).toBeNull()
  })
})
