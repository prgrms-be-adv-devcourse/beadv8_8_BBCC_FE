import { describe, expect, it } from 'vitest'
import { toCategories, type CategoryTreeDto } from '@/entities/product'

const node = (
  categoryId: string,
  name: string,
  children: CategoryTreeDto[] = [],
): CategoryTreeDto => ({
  categoryId,
  name,
  leaf: children.length === 0,
  children,
})

describe('toCategories: 카테고리 트리 → 고를 수 있는 끝 카테고리', () => {
  it('끝 카테고리만 순서대로, 경로 이름과 함께', () => {
    const tree = [
      node('10', '상의', [node('11', '티셔츠'), node('12', '맨투맨')]),
      node('20', '하의', [node('21', '바지', [node('22', '조거 팬츠')])]),
      node('30', '아우터'),
    ]
    expect(toCategories(tree)).toEqual([
      { id: '11', name: '티셔츠', path: '상의 > 티셔츠' },
      { id: '12', name: '맨투맨', path: '상의 > 맨투맨' },
      { id: '22', name: '조거 팬츠', path: '하의 > 바지 > 조거 팬츠' },
      { id: '30', name: '아우터', path: '아우터' },
    ])
  })

  it('빈 트리', () => {
    expect(toCategories([])).toEqual([])
  })
})
