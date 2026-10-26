import { PRODUCT_SORT_LABEL, type ProductSort } from '@/entities/product'

const SORTS = Object.keys(PRODUCT_SORT_LABEL) as ProductSort[]

type ProductSortSelectProps = {
  sort: ProductSort | undefined
  onChange: (sort: ProductSort) => void
}

/** 목록 머리 오른쪽의 정렬 (BE GET /products의 sort). 글자만 보이는 작은 선택 칸 */
export function ProductSortSelect({ sort, onChange }: ProductSortSelectProps) {
  return (
    <select
      aria-label="정렬"
      className="text-ink rounded-input border-field-edge bg-paper hover:bg-paper-2 h-9 cursor-pointer border px-2.5 text-sm font-semibold"
      value={sort ?? 'NEWEST'}
      onChange={(e) => onChange(e.target.value as ProductSort)}
    >
      {SORTS.map((value) => (
        <option key={value} value={value}>
          {PRODUCT_SORT_LABEL[value]}
        </option>
      ))}
    </select>
  )
}
