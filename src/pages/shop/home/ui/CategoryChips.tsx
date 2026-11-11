import {
  ALL_CATEGORIES_ICON,
  CategoryIcon,
  categoryIconOf,
  type Category,
} from '@/entities/product'
import { cn } from '@/shared/lib'

type CategoryChipsProps = {
  categories: Category[]
  selectedId: string | null
  onSelect: (categoryId: string | null) => void
}

/** 카테고리 바로가기 (확정 시안): 둥근 칩 한 줄 (기본 카테고리는 작은 아이콘을 앞에). 고른 칩은 브랜드 색으로 채운다. 좁으면 가로로 민다 */
export function CategoryChips({ categories, selectedId, onSelect }: CategoryChipsProps) {
  const items = [
    { id: null, name: '전체', label: '전체 카테고리', icon: ALL_CATEGORIES_ICON },
    ...categories.map((category) => ({
      id: category.id,
      name: category.name,
      label: category.name,
      icon: categoryIconOf(category.name),
    })),
  ]
  return (
    <section
      aria-label="카테고리"
      className="-mx-4 [scrollbar-width:none] overflow-x-auto px-4 md:-mx-1 md:px-1"
    >
      <div className="flex w-max gap-2 py-1">
        {items.map((item) => {
          const active = selectedId === item.id
          return (
            <button
              key={item.id ?? 'all'}
              type="button"
              aria-label={item.label}
              aria-pressed={active}
              onClick={() => onSelect(item.id)}
              className={cn(
                'flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm transition-colors',
                active
                  ? 'bg-signal border-signal text-signal-ink font-semibold'
                  : 'border-rule text-ink hover:border-signal',
              )}
            >
              {item.icon && <CategoryIcon paths={item.icon} className="size-4" />}
              {item.name}
            </button>
          )
        })}
      </div>
    </section>
  )
}
