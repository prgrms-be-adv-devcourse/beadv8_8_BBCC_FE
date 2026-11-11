import type { Category } from './product'

/**
 * 골라 둔 카테고리(주소 ?cat=)를 고른 자녀에게 보이는 목록에 맞춘다. 목록에 없으면(남아로 바꿨는데 치마) null → 거르기를 푼다.
 * 목록을 아직 받기 전(undefined)에는 그대로 둔다 (불러오는 동안 거르기가 풀리지 않게)
 */
export function visibleCategoryIdOf(
  categoryId: string | null,
  categories: Category[] | undefined,
): string | null {
  if (!categoryId || !categories) return categoryId
  return categories.some((category) => category.id === categoryId) ? categoryId : null
}
