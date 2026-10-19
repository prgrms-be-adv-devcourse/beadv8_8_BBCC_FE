import { CATEGORY_ICONS } from '../config/category-icons'

/** 카테고리 이름 → 아이콘 path. 없으면 null (첫 글자로 보인다) */
export function categoryIconOf(name: string): string[] | null {
  return CATEGORY_ICONS[name.trim()] ?? null
}
