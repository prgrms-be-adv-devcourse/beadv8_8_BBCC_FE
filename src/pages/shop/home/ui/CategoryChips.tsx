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

/** 카테고리 바로가기: 낙서 아이콘 위 · 이름 아래. 아이콘이 없는 카테고리는 첫 글자 칸. 고른 것은 이름을 먹색으로 채운다. 좁으면 가로로 민다 */
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
      <div className="flex w-max gap-3.5 py-2 md:gap-5">
        {items.map((item) => {
          const active = selectedId === item.id
          return (
            <button
              key={item.id ?? 'all'}
              type="button"
              aria-label={item.label}
              aria-pressed={active}
              onClick={() => onSelect(item.id)}
              className="group text-ink flex w-16 shrink-0 flex-col items-center gap-2 text-[13px] font-bold md:w-19"
            >
              <span className="flex aspect-square w-full items-center justify-center transition-transform duration-200 motion-safe:group-hover:-rotate-6">
                {item.icon ? (
                  <CategoryIcon icon={item.icon} className="size-full" />
                ) : (
                  <span
                    aria-hidden
                    className="border-ink bg-paper-2 font-display flex size-[76%] items-center justify-center border-[1.5px] text-2xl"
                  >
                    {item.name.trim().charAt(0)}
                  </span>
                )}
              </span>
              <span
                className={cn(
                  'max-w-full truncate px-1.5 py-px',
                  active && 'bg-ink text-paper',
                  !active && 'group-hover:underline',
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
