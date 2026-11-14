import { cn } from '@/shared/lib'
import { Badge } from '@/shared/ui/badge'
import type { OptionChip } from '../model/product'
import { chipNoteOf, isChipPickable } from '../model/option-picker.rules'

/**
 * 색 칩 모양 (자리 크기에 맞춰 고른다)
 * - chip: 견본이 붙은 칩
 * - detail: 휴대폰은 칩, 넓은 화면은 큰 견본 타일 (상품 상세)
 * - quick: 휴대폰은 견본만, 넓은 화면은 칩 (담기 팝업)
 */
export type ColorChipLook = 'chip' | 'detail' | 'quick'

const LOOK: Record<ColorChipLook, { button: string; swatch: string; name: string; note: string }> =
  {
    chip: { button: 'min-h-10 gap-2 px-2.5 py-1', swatch: 'size-5', name: '', note: '' },
    detail: {
      button:
        'min-h-10 gap-2 px-2.5 py-1 md:w-[76px] md:flex-col md:items-stretch md:gap-1.5 md:p-1.5',
      swatch: 'size-5 md:aspect-square md:size-auto md:w-full',
      name: 'md:truncate md:text-center md:text-xs',
      note: 'md:text-center',
    },
    quick: {
      button:
        'size-11 justify-center md:size-auto md:min-h-10 md:justify-start md:gap-2 md:px-2.5 md:py-1',
      swatch: 'size-8 md:size-5',
      name: 'max-md:sr-only',
      note: 'max-md:sr-only',
    },
  }

/** 막힌 칸(품절 · 없음) 위에 긋는 사선. 색 칩 · 글자 칩이 같이 쓴다 */
export const BLOCKED_CHIP =
  "opacity-45 after:pointer-events-none after:absolute after:inset-0 after:bg-[linear-gradient(to_top_right,transparent_calc(50%_-_0.75px),var(--ink)_calc(50%_-_0.75px),var(--ink)_calc(50%_+_0.75px),transparent_calc(50%_+_0.75px))] after:content-['']"

type ColorSwatchProps = {
  colorCode: string
  isPicked?: boolean
  className?: string
}

/** 색 견본 한 칸. 고른 견본에는 체크를 그린다 (어떤 색 위에서도 보이게 먹색 선 위에 종이색 선) */
export function ColorSwatch({ colorCode, isPicked = false, className }: ColorSwatchProps) {
  return (
    <span
      aria-hidden
      data-swatch
      className={cn(
        'border-ink/25 flex shrink-0 items-center justify-center border',
        className ?? 'size-4',
      )}
      style={{ backgroundColor: colorCode }}
    >
      {isPicked && (
        <svg
          viewBox="0 0 16 16"
          className="size-[62%] max-h-6 max-w-6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m3.5 8.5 3 3 6-7" stroke="var(--ink)" strokeWidth="4.5" />
          <path d="m3.5 8.5 3 3 6-7" stroke="var(--paper)" strokeWidth="2" />
        </svg>
      )}
    </span>
  )
}

type ColorOptionChipProps = {
  chip: OptionChip & { colorCode: string }
  look: ColorChipLook
  onPick: () => void
}

/** 색 값 칩: 견본 + 이름. 고르면 견본 안 체크와 굵은 테두리, 막히면 흐리게 + 사선 (모양 셋이 같다) */
export function ColorOptionChip({ chip, look, onPick }: ColorOptionChipProps) {
  const note = chipNoteOf(chip)
  const isPickable = isChipPickable(chip.state)
  const style = LOOK[look]
  return (
    <button
      type="button"
      aria-pressed={chip.isPicked}
      disabled={!isPickable}
      onClick={onPick}
      className={cn(
        'relative flex items-center border-[1.5px] text-sm disabled:cursor-not-allowed',
        style.button,
        chip.isPicked
          ? 'border-ink shadow-[0_0_0_1.5px_var(--ink)]'
          : 'border-rule hover:border-ink',
        !isPickable && BLOCKED_CHIP,
      )}
    >
      <ColorSwatch colorCode={chip.colorCode} isPicked={chip.isPicked} className={style.swatch} />
      <span className={cn('font-medium', style.name)}>{chip.name}</span>
      {chip.isRecommended && <Badge variant="highlight">추천</Badge>}
      {note && (
        <span
          className={cn(
            'text-xs',
            chip.state === 'LOW' ? 'text-destructive' : 'opacity-80',
            style.note,
          )}
        >
          {note}
        </span>
      )}
    </button>
  )
}
