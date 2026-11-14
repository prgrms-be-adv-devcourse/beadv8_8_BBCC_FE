import { useState } from 'react'
import {
  ColorSwatch,
  pickedColorNamesOf,
  type ProductSearch,
  useCategoryInputsQuery,
} from '@/entities/product'
import { cn } from '@/shared/lib'

type ProductFilterBarProps = {
  search: ProductSearch
  /** 바뀐 값만 넘긴다 (주소에 얹는 쪽이 최신 값과 합친다) */
  onChange: (patch: Pick<ProductSearch, 'attributes'>) => void
}

/**
 * (카테고리를 골랐을 때) 옵션 값 거르기 칩. BE GET /products의 attributes. 거를 것이 없으면 그리지 않는다.
 * 색 값이 있는 옵션은 견본만 보이고(이름은 읽어 주는 이름 · 풍선말), 고른 색 이름을 항목 이름 옆에 적는다.
 * 휴대폰에서는 칩이 첫 화면을 덮지 않게 「필터」 버튼으로 접는다. 고른 개수는 버튼에 보인다
 */
export function ProductFilterBar({ search, onChange }: ProductFilterBarProps) {
  const inputs = useCategoryInputsQuery(search.categoryId ?? '')
  const selected = new Set(search.attributes ?? [])
  const [isOpen, setIsOpen] = useState(false)
  const toggle = (key: string) => {
    const next = new Set(selected)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    onChange({ attributes: [...next] })
  }

  if (!search.categoryId || !inputs.data?.optionAttributes.length) return null
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5 text-sm">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls="product-filter-chips"
        onClick={() => setIsOpen((open) => !open)}
        className="border-ink bg-paper text-ink flex h-11 items-center gap-1.5 border-[1.5px] px-4 text-sm font-bold md:hidden"
      >
        필터{selected.size > 0 && <span className="text-signal figure">{selected.size}</span>}
        <span aria-hidden>{isOpen ? '▴' : '▾'}</span>
      </button>
      <div
        id="product-filter-chips"
        className={cn('flex flex-wrap items-center gap-x-5 gap-y-2.5', !isOpen && 'max-md:hidden')}
      >
        {inputs.data.optionAttributes.map((attribute) => {
          const pickedColors = pickedColorNamesOf(attribute, selected)
          return (
            <div
              key={attribute.id}
              role="group"
              aria-label={`${attribute.name} 거르기`}
              className="flex flex-wrap items-center gap-2"
            >
              <span className="text-ink mr-1 text-xs font-bold">
                {attribute.name}
                {pickedColors.length > 0 && ` · ${pickedColors.join(', ')}`}
              </span>
              {attribute.values.map((value) => {
                const key = `${attribute.code}:${value.id}`
                const on = selected.has(key)
                if (value.colorCode)
                  return (
                    <button
                      key={value.id}
                      type="button"
                      aria-pressed={on}
                      aria-label={value.name}
                      title={value.name}
                      onClick={() => toggle(key)}
                      className={cn(
                        'flex size-11 items-center justify-center border-[1.5px] transition-colors md:size-9',
                        on
                          ? 'border-ink shadow-[0_0_0_1.5px_var(--ink)]'
                          : 'border-rule hover:border-ink',
                      )}
                    >
                      <ColorSwatch
                        colorCode={value.colorCode}
                        isPicked={on}
                        className="size-8 md:size-6"
                      />
                    </button>
                  )
                return (
                  <button
                    key={value.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(key)}
                    className={cn(
                      'border-ink flex h-11 items-center gap-1.5 border-[1.5px] px-3.5 text-[13px] font-bold transition-colors md:h-8 md:px-3',
                      on ? 'bg-ink text-paper' : 'bg-paper text-ink hover:bg-marker',
                    )}
                  >
                    {value.name}
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>
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
