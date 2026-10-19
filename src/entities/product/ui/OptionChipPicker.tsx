import { cn } from '@/shared/lib'
import { Badge } from '@/shared/ui/badge'
import type { OptionChip, OptionChipRow } from '../model/product'
import { isChipPickable } from '../model/option-picker.rules'

type OptionChipPickerProps = {
  rows: OptionChipRow[]
  onPick: (attributeId: string, valueId: string) => void
}

const CHIP_NOTE: Partial<Record<OptionChip['state'], string>> = {
  SOLD_OUT: '품절',
  NONE: '없음',
}

/** 옵션 항목마다 칩 한 줄 (예: 색상 칩 · 사이즈 칩). 막힌 칩은 흐리게 두고 고를 수 없다 */
export function OptionChipPicker({ rows, onPick }: OptionChipPickerProps) {
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.attributeId} role="group" aria-label={row.name} className="space-y-1.5">
          <p className="text-sm font-semibold">
            {row.name}
            {row.pickedName && ` · ${row.pickedName}`}
          </p>
          <div className="flex flex-wrap gap-2">
            {row.chips.map((chip) => (
              <OptionChipButton
                key={chip.valueId}
                chip={chip}
                onPick={() => onPick(row.attributeId, chip.valueId)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

type OptionChipButtonProps = { chip: OptionChip; onPick: () => void }

function OptionChipButton({ chip, onPick }: OptionChipButtonProps) {
  const note = chip.state === 'LOW' ? `${chip.remaining}개 남았어요` : CHIP_NOTE[chip.state]
  return (
    <button
      type="button"
      aria-pressed={chip.isPicked}
      disabled={!isChipPickable(chip.state)}
      onClick={onPick}
      className={cn(
        'flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1 text-sm disabled:opacity-40',
        chip.isPicked && 'border-primary bg-primary text-primary-foreground',
      )}
    >
      {chip.colorCode && (
        <span
          aria-hidden
          data-swatch
          className="size-4 shrink-0 rounded-full border border-black/15"
          style={{ backgroundColor: chip.colorCode }}
        />
      )}
      <span className="font-medium">{chip.name}</span>
      {chip.isRecommended && <Badge variant="highlight">추천</Badge>}
      {note && (
        <span
          className={cn(
            'text-xs',
            chip.state === 'LOW' && !chip.isPicked ? 'text-destructive' : 'opacity-80',
          )}
        >
          {note}
        </span>
      )}
    </button>
  )
}
