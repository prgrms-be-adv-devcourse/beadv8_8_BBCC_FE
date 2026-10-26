import {
  ALL_CATEGORIES_ICON,
  CategoryIcon,
  categoryIconOf,
  type Category,
} from '@/entities/product'
import { cn } from '@/shared/lib'

type CategoryCirclesProps = {
  categories: Category[]
  selectedId: string | null
  onSelect: (categoryId: string | null) => void
}

/** 카테고리 바로가기: 동그라미 아이콘 줄 (아이콘이 없으면 첫 글자). 좁으면 가로로 민다 */
export function CategoryCircles({ categories, selectedId, onSelect }: CategoryCirclesProps) {
  const items: { id: string | null; name: string; label: string; icon: string[] | null }[] = [
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
      {/* 위아래 · 왼쪽 여백: 고른 동그라미의 바깥 고리가 가로 스크롤 영역에 잘리지 않게.
          가운데 정렬은 w-max + mx-auto로 (justify-center는 넘칠 때 왼쪽이 잘린다) */}
      <div className="mx-auto flex w-max gap-3 py-1 md:gap-5">
        {items.map((item) => {
          const active = selectedId === item.id
          return (
            <button
              key={item.id ?? 'all'}
              type="button"
              aria-label={item.label}
              aria-pressed={active}
              onClick={() => onSelect(item.id)}
              className="group flex w-16 shrink-0 flex-col items-center gap-1.5 rounded-md pb-1"
            >
              <span
                aria-hidden
                className={cn(
                  'flex size-14 items-center justify-center rounded-full text-base font-bold transition-colors',
                  active
                    ? 'bg-signal-soft text-signal ring-signal ring-2'
                    : 'bg-paper-2 text-ink-2 group-hover:bg-paper-3',
                )}
              >
                {item.icon ? (
                  <CategoryIcon paths={item.icon} className="size-7" />
                ) : (
                  item.name.slice(0, 1)
                )}
              </span>
              <span
                className={cn(
                  'text-[13px]',
                  active ? 'text-ink font-bold' : 'text-ink-2 font-medium',
                )}
              >
                {item.name}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
