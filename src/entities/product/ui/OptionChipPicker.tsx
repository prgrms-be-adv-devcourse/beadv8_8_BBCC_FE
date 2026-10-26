import { Fragment, type ReactNode } from 'react'
import { cn } from '@/shared/lib'
import { Badge } from '@/shared/ui/badge'
import type { OptionChip, OptionChipRow } from '../model/product'
import { chipNoteOf, isChipPickable } from '../model/option-picker.rules'

type OptionChipPickerProps = {
  rows: OptionChipRow[]
  onPick: (attributeId: string, valueId: string) => void
  /** 항목 줄 바로 위에 끼울 것 (항목 ID → 내용). 예: 사이즈 칩 위 추천 한 줄 */
  aboveRow?: Record<string, ReactNode>
}

/** 옵션 항목마다 칩 한 줄 (예: 색상 칩 · 사이즈 칩). 막힌 칩은 흐리게 두고 고를 수 없다. 값이 하나뿐인 항목은 고정 글자 */
export function OptionChipPicker({ rows, onPick, aboveRow }: OptionChipPickerProps) {
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <Fragment key={row.attributeId}>
          {aboveRow?.[row.attributeId]}
          {row.isFixed ? (
            <FixedOptionRow row={row} />
          ) : (
            <div role="group" aria-label={row.name} className="space-y-1.5">
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
          )}
        </Fragment>
      ))}
    </div>
  )
}

type FixedOptionRowProps = { row: OptionChipRow }

/** 값이 하나뿐인 항목: 누를 수 없는 「색상: ● 네이비」 */
function FixedOptionRow({ row }: FixedOptionRowProps) {
  const chip = row.chips[0]
  const note = chipNoteOf(chip)
  return (
    <p className="flex items-center gap-1.5 text-sm">
      <span className="font-semibold">{row.name}:</span>{' '}
      {chip.colorCode && <ColorSwatch colorCode={chip.colorCode} />}
      <span>{chip.name}</span>{' '}
      {note && (
        <span
          className={cn(
            'text-xs',
            isChipPickable(chip.state) ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {note}
        </span>
      )}
    </p>
  )
}

type ColorSwatchProps = { colorCode: string }

function ColorSwatch({ colorCode }: ColorSwatchProps) {
  return (
    <span
      aria-hidden
      data-swatch
      className="size-4 shrink-0 rounded-full border border-black/15"
      style={{ backgroundColor: colorCode }}
    />
  )
}

type OptionChipButtonProps = { chip: OptionChip; onPick: () => void }

function OptionChipButton({ chip, onPick }: OptionChipButtonProps) {
  const note = chipNoteOf(chip)
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
      {chip.colorCode && <ColorSwatch colorCode={chip.colorCode} />}
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
