import { cn, formatWon } from '@/shared/lib'
import { Badge } from '@/shared/ui/badge'
import type { ProductOption } from '../model/product'
import { isSelectable, optionName } from '../model/product.rules'

type ProductOptionListProps = {
  options: ProductOption[]
  selectedId: string | null
  /** 추천 사이즈 (배지 표시) */
  recommendedSize?: string | null
  onSelect: (optionId: string) => void
}

export function ProductOptionList({
  options,
  selectedId,
  recommendedSize,
  onSelect,
}: ProductOptionListProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          disabled={!isSelectable(option)}
          onClick={() => onSelect(option.id)}
          className={cn(
            'rounded-lg border p-2 text-left text-sm disabled:opacity-40',
            selectedId === option.id && 'border-primary ring-primary ring-1',
          )}
        >
          <div className="flex items-center justify-between">
            <span className="font-medium">{optionName(option)}</span>
            {option.size === recommendedSize && <Badge variant="highlight">추천</Badge>}
            {option.soldOut && <Badge variant="muted">품절</Badge>}
          </div>
          <div className="text-muted-foreground text-xs">
            권장 키 {option.minHeightCm}~{option.maxHeightCm}cm · {formatWon(option.price)}
          </div>
        </button>
      ))}
    </div>
  )
}
