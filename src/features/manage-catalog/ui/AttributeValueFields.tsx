import type { AttributeValueForm } from '@/entities/catalog'
import { Input } from '@/shared/ui/input'

type AttributeValueFieldsProps = {
  value: AttributeValueForm
  hasColor: boolean
  onChange: (value: AttributeValueForm) => void
}

/** 목록 값 한 줄: 이름 (+ 팔레트면 색 코드와 견본) */
export function AttributeValueFields({ value, hasColor, onChange }: AttributeValueFieldsProps) {
  return (
    <span className="flex min-w-0 flex-1 items-center gap-2">
      <Input
        aria-label="목록 값 이름"
        className="h-10"
        placeholder="값 이름 (예: 110)"
        value={value.name}
        onChange={(e) => onChange({ ...value, name: e.target.value })}
      />
      {hasColor && (
        <>
          <Input
            aria-label="색 코드"
            placeholder="#rrggbb"
            className="h-10 w-28 shrink-0"
            value={value.colorCode}
            onChange={(e) => onChange({ ...value, colorCode: e.target.value })}
          />
          <span
            aria-hidden
            className="size-6 shrink-0 rounded border"
            style={{ backgroundColor: value.colorCode.trim() || 'transparent' }}
          />
        </>
      )}
    </span>
  )
}
