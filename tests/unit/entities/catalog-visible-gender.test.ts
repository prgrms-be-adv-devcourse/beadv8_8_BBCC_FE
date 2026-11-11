import { describe, expect, it } from 'vitest'
import {
  toCatalogCategory,
  toCategoryChangeForm,
  toCategoryChangeRequest,
  toCategoryCreateRequest,
  type CategoryDto,
} from '@/entities/catalog'

// 관리자 카테고리 「보일 성별」(BE #1219 visibleGender): ALL(모두) · GIRL(여아만).
// 만들기는 고른 값을 보내고(기본 ALL), 말단 수정은 지금 값으로 채워 고른 값을 보낸다
const dto = (visibleGender: 'ALL' | 'GIRL'): CategoryDto => ({
  categoryId: '13',
  name: '치마',
  parentId: '10',
  leaf: true,
  productTypeId: '1',
  productTypeName: '의류',
  visibleGender,
  measurementItems: [],
})

describe('카테고리 보일 성별', () => {
  it.each(['ALL', 'GIRL'] as const)('응답의 %s를 그대로 옮긴다', (gender) => {
    expect(toCatalogCategory(dto(gender)).visibleGender).toBe(gender)
  })

  it.each(['ALL', 'GIRL'] as const)('만들기 요청에 고른 %s를 싣는다', (gender) => {
    const request = toCategoryCreateRequest({
      name: '치마',
      parentId: '10',
      kind: 'LEAF',
      productTypeId: '1',
      measurementItemIds: [],
      visibleGender: gender,
    })
    expect(request.visibleGender).toBe(gender)
  })

  it('수정 폼은 지금 값으로 채우고, 고른 값을 요청에 싣는다', () => {
    const form = toCategoryChangeForm(toCatalogCategory(dto('GIRL')))
    expect(form.visibleGender).toBe('GIRL')
    expect(toCategoryChangeRequest({ ...form, visibleGender: 'ALL' }).visibleGender).toBe('ALL')
  })
})
