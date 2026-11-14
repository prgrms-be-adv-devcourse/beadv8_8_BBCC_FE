import { CATEGORY_ICONS, type CategoryDoodle } from '../config/category-icons'

/** 카테고리 이름 → 낙서 아이콘. 없으면 null (첫 글자로 보인다) */
export function categoryIconOf(name: string): CategoryDoodle | null {
  return CATEGORY_ICONS[name.trim()] ?? null
}
