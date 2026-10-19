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

const TINTS = ['bg-primary-soft', 'bg-highlight-soft', 'bg-growth-soft']

/** "무엇을 찾아볼까요?" 동그란 카테고리 */
export function CategoryCircles({ categories, selectedId, onSelect }: CategoryCirclesProps) {
  const items: { id: string | null; name: string; label: string; icon: string[] | null }[] = [
    { id: null, name: '전체보기', label: '전체 카테고리', icon: ALL_CATEGORIES_ICON },
    ...categories.map((category) => ({
      id: category.id,
      name: category.name,
      label: category.name,
      icon: categoryIconOf(category.name),
    })),
  ]
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-extrabold">무엇을 찾아볼까요?</h2>
      <div className="flex gap-4 overflow-x-auto pb-1 md:gap-8">
        {items.map((item, index) => {
          const active = selectedId === item.id
          return (
            <button
              key={item.id ?? 'all'}
              type="button"
              aria-label={item.label}
              aria-pressed={active}
              onClick={() => onSelect(item.id)}
              className="flex w-16 shrink-0 flex-col items-center gap-2 text-sm md:w-20"
            >
              <span
                aria-hidden
                className={cn(
                  'flex size-14 items-center justify-center rounded-full border-2 text-lg font-bold md:size-16',
                  item.id === null ? 'bg-white' : TINTS[index % TINTS.length],
                  item.icon && 'text-primary',
                  active ? 'border-primary text-primary' : 'border-transparent',
                )}
              >
                {item.icon ? (
                  <CategoryIcon paths={item.icon} className="size-8 md:size-9" />
                ) : (
                  item.name.slice(0, 1)
                )}
              </span>
              <span className={cn(active && 'text-primary font-bold')}>{item.name}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
