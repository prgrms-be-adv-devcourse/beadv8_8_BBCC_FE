import {
  PRODUCT_SORT_LABEL,
  type ProductSearch,
  type ProductSort,
  useCategoryInputsQuery,
} from '@/entities/product'
import { cn } from '@/shared/lib'

type ProductFilterBarProps = {
  search: ProductSearch
  /** 바뀐 값만 넘긴다 (주소에 얹는 쪽이 최신 값과 합친다) */
  onChange: (patch: Pick<ProductSearch, 'sort' | 'attributes'>) => void
}

const SORTS = Object.keys(PRODUCT_SORT_LABEL) as ProductSort[]

/** 상품 목록 정렬 + (카테고리를 골랐을 때) 옵션 값 거르기. BE GET /products의 sort · attributes */
export function ProductFilterBar({ search, onChange }: ProductFilterBarProps) {
  const inputs = useCategoryInputsQuery(search.categoryId ?? '')
  const selected = new Set(search.attributes ?? [])
  const toggle = (key: string) => {
    const next = new Set(selected)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    onChange({ attributes: [...next] })
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
      <label className="flex items-center gap-1.5">
        <span className="text-muted-foreground">정렬</span>
        <select
          aria-label="정렬"
          className="rounded-md border bg-white px-2 py-1"
          value={search.sort ?? 'NEWEST'}
          onChange={(e) => onChange({ sort: e.target.value as ProductSort })}
        >
          {SORTS.map((sort) => (
            <option key={sort} value={sort}>
              {PRODUCT_SORT_LABEL[sort]}
            </option>
          ))}
        </select>
      </label>
      {search.categoryId &&
        inputs.data?.optionAttributes.map((attribute) => (
          <div
            key={attribute.id}
            role="group"
            aria-label={`${attribute.name} 거르기`}
            className="flex flex-wrap items-center gap-1"
          >
            <span className="text-muted-foreground mr-0.5">{attribute.name}</span>
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
                    'flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs',
                    on ? 'border-primary bg-primary/10 text-primary font-semibold' : 'bg-white',
                  )}
                >
                  {value.colorCode && (
                    <span
                      aria-hidden
                      className="size-3 rounded-full border"
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
          className="text-muted-foreground text-xs underline"
          onClick={() => onChange({ attributes: [] })}
        >
          거르기 지우기
        </button>
      )}
    </div>
  )
}
