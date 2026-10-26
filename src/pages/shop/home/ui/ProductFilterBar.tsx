import { type ProductSearch, useCategoryInputsQuery } from '@/entities/product'
import { cn } from '@/shared/lib'

type ProductFilterBarProps = {
  search: ProductSearch
  /** 바뀐 값만 넘긴다 (주소에 얹는 쪽이 최신 값과 합친다) */
  onChange: (patch: Pick<ProductSearch, 'attributes'>) => void
}

/** (카테고리를 골랐을 때) 옵션 값 거르기 칩. BE GET /products의 attributes. 거를 것이 없으면 그리지 않는다 */
export function ProductFilterBar({ search, onChange }: ProductFilterBarProps) {
  const inputs = useCategoryInputsQuery(search.categoryId ?? '')
  const selected = new Set(search.attributes ?? [])
  const toggle = (key: string) => {
    const next = new Set(selected)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    onChange({ attributes: [...next] })
  }

  if (!search.categoryId || !inputs.data?.optionAttributes.length) return null
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5 text-sm">
      {inputs.data.optionAttributes.map((attribute) => (
        <div
          key={attribute.id}
          role="group"
          aria-label={`${attribute.name} 거르기`}
          className="flex flex-wrap items-center gap-2"
        >
          <span className="text-ink-3 mr-1 text-[13px]">{attribute.name}</span>
          {attribute.values.map((value) => {
            const key = `${attribute.code}:${value.id}`
            const on = selected.has(key)
            return (
              <button
                key={value.id}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(key)}
                className={cn(
                  'flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold transition-colors',
                  on
                    ? 'border-ink bg-ink text-paper'
                    : 'border-rule bg-paper text-ink-2 hover:border-field-edge',
                )}
              >
                {value.colorCode && (
                  <span
                    aria-hidden
                    className="border-rule size-3.5 rounded-full border"
                    style={{ backgroundColor: value.colorCode }}
                  />
                )}
                {value.name}
              </button>
            )
          })}
        </div>
      ))}
      {(search.attributes?.length ?? 0) > 0 && (
        <button
          type="button"
          className="text-ink-3 hover:text-ink text-[13px] underline underline-offset-4"
          onClick={() => onChange({ attributes: [] })}
        >
          거르기 지우기
        </button>
      )}
    </div>
  )
}
