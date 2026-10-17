import type { CatalogCategory, CategoryForm } from './catalog'

/** 부모로 고를 수 있는 카테고리: 중간 카테고리만 (말단 아래에는 만들 수 없다) */
export function parentCandidates(categories: CatalogCategory[]): CatalogCategory[] {
  return categories.filter((category) => !category.isLeaf)
}

/** 최상위부터 이름을 이은 경로 (예: 의류 > 상의) */
export function categoryPath(category: CatalogCategory, categories: CatalogCategory[]): string {
  const names = [category.name]
  let parentId = category.parentId
  while (parentId) {
    const parent = categories.find((item) => item.id === parentId)
    if (!parent) break
    names.unshift(parent.name)
    parentId = parent.parentId
  }
  return names.join(' > ')
}

export function validateCategoryForm(
  form: CategoryForm,
  categories: CatalogCategory[],
): string | null {
  const name = form.name.trim()
  const parentId = form.parentId || null
  if (!name) return '카테고리 이름을 입력해 주세요.'
  if (categories.some((category) => category.id === parentId && category.isLeaf))
    return '말단 카테고리 아래에는 카테고리를 만들 수 없어요.'
  // BE는 같은 부모 아래 같은 이름을 409로 막는다 (최상위끼리도)
  if (categories.some((category) => category.parentId === parentId && category.name === name))
    return '같은 위치에 같은 이름의 카테고리가 있어요.'
  if (form.kind === 'LEAF' && !form.productTypeId) return '말단 카테고리는 상품 유형을 골라 주세요.'
  return null
}

export type CategoryTreeRow = { category: CatalogCategory; depth: number }

/** 평면 목록(ID 순서) → 트리 순서: 부모 바로 아래 자식, 같은 부모 안에서는 받은 순서. depth는 최상위가 0 */
export function categoryTree(categories: CatalogCategory[]): CategoryTreeRow[] {
  const rows: CategoryTreeRow[] = []
  const visit = (parentId: string | null, depth: number) => {
    for (const category of categories.filter((item) => item.parentId === parentId)) {
      rows.push({ category, depth })
      visit(category.id, depth + 1)
    }
  }
  visit(null, 0)
  return rows
}
