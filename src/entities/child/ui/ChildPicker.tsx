import { Button } from '@/shared/ui/button'
import type { Child } from '../model/child'

type Props = {
  children: Child[]
  selectedId: string | null
  onSelect: (childId: string | null) => void
  /** 선택 해제 버튼 문구 (없으면 버튼 없음) */
  noneLabel?: string
  /** 자녀 버튼 문구 */
  label?: (child: Child) => string
}

export function ChildPicker({ children, selectedId, onSelect, noneLabel, label }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {noneLabel && (
        <Button
          size="sm"
          variant={selectedId === null ? 'default' : 'outline'}
          onClick={() => onSelect(null)}
        >
          {noneLabel}
        </Button>
      )}
      {children.map((child) => (
        <Button
          key={child.id}
          size="sm"
          variant={selectedId === child.id ? 'default' : 'outline'}
          onClick={() => onSelect(child.id)}
        >
          {label ? label(child) : `${child.name} (${child.heightCm}cm)`}
        </Button>
      ))}
    </div>
  )
}
