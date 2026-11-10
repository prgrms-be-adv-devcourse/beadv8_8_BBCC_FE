import { PRODUCT_SORT_LABEL, type ProductSort } from '@/entities/product'

type ProductSortSelectProps = {
  /** 실제로 쓰는 정렬 (검색어가 있으면 기본 관련도순) */
  sort: ProductSort
  /** 고를 수 있는 정렬 (관련도순은 검색어가 있을 때만) */
  options: ProductSort[]
  onChange: (sort: ProductSort) => void
}

/** 목록 머리 오른쪽의 정렬 (BE GET /products의 sort). 글자만 보이는 작은 선택 칸 */
export function ProductSortSelect({ sort, options, onChange }: ProductSortSelectProps) {
  return (
    <select
      aria-label="정렬"
      className="text-ink rounded-input border-field-edge bg-paper hover:bg-paper-2 h-9 cursor-pointer border px-2.5 text-sm font-semibold"
      value={sort}
      onChange={(e) => onChange(e.target.value as ProductSort)}
    >
      {options.map((value) => (
        <option key={value} value={value}>
          {PRODUCT_SORT_LABEL[value]}
        </option>
      ))}
    </select>
  )
}
