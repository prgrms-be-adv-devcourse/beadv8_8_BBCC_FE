import { cn } from '@/shared/lib'
import type { CategoryDoodle } from '../config/category-icons'

type CategoryIconProps = {
  icon: CategoryDoodle
  className?: string
}

/** 얼룩 한 덩이: 선보다 4만큼 오른쪽 아래로 어긋나게 깔린다 */
const BLOB = 'M13 31c0-13 11-21 23-19s19 11 17 24-13 19-25 17S13 44 13 31z'

const BLOB_FILL: Record<CategoryDoodle['blob'], string> = {
  sheet: 'fill-sheet',
  marker: 'fill-marker',
}

/** 카테고리 낙서 아이콘: 색 얼룩 위에 먹색 선 (선은 글자색을 따른다). 벡터라 크기를 바꿔도 깨지지 않는다 */
export function CategoryIcon({ icon, className }: CategoryIconProps) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={cn('size-16 overflow-visible', className)}>
      <path d={BLOB} transform="translate(4 4)" className={BLOB_FILL[icon.blob]} />
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {icon.strokes.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
    </svg>
  )
}
