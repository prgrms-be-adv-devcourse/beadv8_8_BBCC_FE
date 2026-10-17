import { describe, expect, it } from 'vitest'
import {
  categoryPath,
  categoryTree,
  parentCandidates,
  toCatalogCategory,
  toCategoryCreateRequest,
  validateCategoryForm,
  type CategoryDto,
  type CatalogCategory,
  type CategoryForm,
} from '@/entities/catalog'
import { categoryShape } from '@/entities/catalog/api/catalog.shape'
import { validate } from '@/shared/api'

// 카테고리는 중간(유형 없음) · 말단(유형 + 필수 실측 항목). 말단 아래에는 만들 수 없다

const category = (
  id: string,
  name: string,
  parentId: string | null,
  isLeaf: boolean,
): CatalogCategory => ({
  id,
  name,
  parentId,
  isLeaf,
  productTypeId: isLeaf ? '1' : null,
  productTypeName: isLeaf ? '의류' : null,
  measurementItems: [],
})
const categories = [
  category('10', '의류', null, false),
  category('11', '상의', '10', true),
  category('20', '잡화', null, false),
  category('21', '모자', '20', true),
]
const form = (patch: Partial<CategoryForm> = {}): CategoryForm => ({
  name: '하의',
  parentId: '10',
  kind: 'LEAF',
  productTypeId: '1',
  measurementItemIds: ['1', '5'],
  ...patch,
})

describe('카테고리 고르기 도우미', () => {
  it('부모로 고를 수 있는 것은 중간 카테고리뿐이다', () => {
    expect(parentCandidates(categories).map((item) => item.id)).toEqual(['10', '20'])
  })

  it.each([
    ['10', '의류'],
    ['11', '의류 > 상의'],
    ['21', '잡화 > 모자'],
  ])('%s의 경로는 %s', (id, path) => {
    const target = categories.find((item) => item.id === id)!
    expect(categoryPath(target, categories)).toBe(path)
  })
})

describe('categoryTree: 목록을 트리 순서로 (부모 바로 아래 자식, 같은 부모 안에서는 ID 순서)', () => {
  it('나중에 만든 하위 카테고리도 부모 아래에 깊이와 함께 놓인다', () => {
    const tree = categoryTree([
      ...categories,
      category('101', '신발', null, false),
      category('102', '하의', '10', true),
      category('103', '운동화', '101', true),
    ])
    expect(tree.map(({ category: item, depth }) => [item.name, depth])).toEqual([
      ['의류', 0],
      ['상의', 1],
      ['하의', 1],
      ['잡화', 0],
      ['모자', 1],
      ['신발', 0],
      ['운동화', 1],
    ])
  })
})

describe('validateCategoryForm', () => {
  it.each([
    ['말단 카테고리', form()],
    [
      '최상위 중간 카테고리',
      form({ name: '신발', parentId: '', kind: 'MIDDLE', productTypeId: '' }),
    ],
    ['실측 항목 없는 말단 카테고리', form({ measurementItemIds: [] })],
    ['다른 부모 아래 같은 이름', form({ name: '상의', parentId: '20' })],
  ])('%s는 통과한다', (_case, input) => {
    expect(validateCategoryForm(input, categories)).toBeNull()
  })

  it.each([
    ['이름이 비면', form({ name: ' ' }), '카테고리 이름을 입력해 주세요.'],
    [
      '말단 카테고리 아래에 만들면',
      form({ parentId: '11' }),
      '말단 카테고리 아래에는 카테고리를 만들 수 없어요.',
    ],
    [
      '같은 부모 아래 같은 이름이면',
      form({ name: ' 상의 ' }),
      '같은 위치에 같은 이름의 카테고리가 있어요.',
    ],
    [
      '최상위끼리 같은 이름이면',
      form({ name: '의류', parentId: '', kind: 'MIDDLE' }),
      '같은 위치에 같은 이름의 카테고리가 있어요.',
    ],
    [
      '말단인데 상품 유형이 없으면',
      form({ productTypeId: '' }),
      '말단 카테고리는 상품 유형을 골라 주세요.',
    ],
  ])('%s 거절한다', (_case, input, message) => {
    expect(validateCategoryForm(input, categories)).toBe(message)
  })
})

describe('카테고리 매퍼', () => {
  it.each([
    [
      '말단',
      form({ name: ' 하의 ' }),
      { name: '하의', parentId: '10', productTypeId: '1', measurementItemIds: ['1', '5'] },
    ],
    [
      '최상위 중간 (고른 유형 · 실측 항목은 보내지 않는다)',
      form({ name: '신발', parentId: '', kind: 'MIDDLE' }),
      { name: '신발', parentId: null, productTypeId: null, measurementItemIds: [] },
    ],
  ])('폼 → 요청: %s', (_case, input, expected) => {
    expect(toCategoryCreateRequest(input)).toEqual(expected)
  })

  // BE와 정한 카테고리 목록 응답 예
  const dto: CategoryDto = {
    categoryId: '11',
    name: '상의',
    parentId: '10',
    leaf: true,
    productTypeId: '1',
    productTypeName: '의류',
    measurementItems: [{ measurementItemId: '1', name: '총장', code: 'TOTAL_LENGTH', unit: 'cm' }],
  }

  it('응답 → 모델', () => {
    expect(toCatalogCategory(dto)).toEqual({
      id: '11',
      name: '상의',
      parentId: '10',
      isLeaf: true,
      productTypeId: '1',
      productTypeName: '의류',
      measurementItems: [{ id: '1', name: '총장', code: 'TOTAL_LENGTH', unit: 'cm' }],
    })
  })

  it('응답 예는 응답 모양과 맞는다', () => {
    expect(validate(dto, categoryShape)).toEqual([])
    const middle = {
      ...dto,
      parentId: null,
      leaf: false,
      productTypeId: null,
      productTypeName: null,
      measurementItems: [],
    }
    expect(validate(middle, categoryShape)).toEqual([])
  })
})
