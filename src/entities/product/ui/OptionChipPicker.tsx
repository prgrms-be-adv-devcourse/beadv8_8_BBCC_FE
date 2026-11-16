import { Fragment, type ReactNode } from 'react'
import { cn } from '@/shared/lib'
import { Badge } from '@/shared/ui/badge'
import type { OptionChip, OptionChipRow } from '../model/product'
import { chipNoteOf, isChipPickable } from '../model/option-picker.rules'
import { BLOCKED_CHIP, ColorOptionChip, ColorSwatch, type ColorChipLook } from './ColorOptionChip'

type OptionChipPickerProps = {
  rows: OptionChipRow[]
  onPick: (attributeId: string, valueId: string) => void
  /** 항목 줄 바로 위에 끼울 것 (항목 ID → 내용). 예: 사이즈 칩 위 추천 한 줄 */
  aboveRow?: Record<string, ReactNode>
  /** 색 값이 있는 칩의 모양. 자리 크기에 맞춰 고른다 (기본: 견본이 붙은 칩) */
  colorLook?: ColorChipLook
}

/**
 * 옵션 항목마다 칩 한 줄 (예: 색상 칩 · 사이즈 칩). 막힌 칩은 흐리게 사선을 긋고 고를 수 없다.
 * 값이 하나뿐인 항목은 고정 글자. 색 값이 없는 값은 이름만 든 칸으로 그린다
 */
export function OptionChipPicker({
  rows,
  onPick,
  aboveRow,
  colorLook = 'chip',
}: OptionChipPickerProps) {
  return (
    <div className="space-y-3.5">
      {rows.map((row) => (
        <Fragment key={row.attributeId}>
          {aboveRow?.[row.attributeId]}
          {row.isFixed ? (
            <FixedOptionRow row={row} />
          ) : (
            <div role="group" aria-label={row.name} className="space-y-2">
              <p className="text-[13px] font-bold">
                {row.name}
                {row.pickedName && ` · ${row.pickedName}`}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {row.chips.map((chip) => {
                  const handlePick = () => onPick(row.attributeId, chip.valueId)
                  return chip.colorCode ? (
                    <ColorOptionChip
                      key={chip.valueId}
                      chip={{ ...chip, colorCode: chip.colorCode }}
                      look={colorLook}
                      onPick={handlePick}
                    />
                  ) : (
                    <OptionChipButton key={chip.valueId} chip={chip} onPick={handlePick} />
                  )
                })}
              </div>
            </div>
          )}
        </Fragment>
      ))}
    </div>
  )
}

type FixedOptionRowProps = { row: OptionChipRow }

/** 값이 하나뿐인 항목: 누를 수 없는 「색상: ■ 네이비」 */
function FixedOptionRow({ row }: FixedOptionRowProps) {
  const chip = row.chips[0]
  const note = chipNoteOf(chip)
  return (
    <p className="flex items-center gap-1.5 text-sm">
      <span className="font-bold">{row.name}:</span>{' '}
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

type OptionChipButtonProps = { chip: OptionChip; onPick: () => void }

/** 이름만 든 칸 (사이즈처럼 색 값이 없는 값). 고르면 채운다 */
function OptionChipButton({ chip, onPick }: OptionChipButtonProps) {
  const note = chipNoteOf(chip)
  const isPickable = isChipPickable(chip.state)
  return (
    <button
      type="button"
      aria-pressed={chip.isPicked}
      disabled={!isPickable}
      onClick={onPick}
      className={cn(
        'border-field-edge relative flex min-h-10 min-w-[52px] items-center justify-center gap-1.5 border-[1.5px] px-3 py-1 text-[15px] disabled:cursor-not-allowed',
        chip.isPicked
          ? 'border-primary bg-primary text-primary-foreground'
          : isPickable && 'hover:bg-fit-soft',
        !isPickable && BLOCKED_CHIP,
      )}
    >
      <span className="figure font-bold">{chip.name}</span>
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
