import type { ReferenceFitSummary } from '@/entities/recommendation'

type ReferenceFitLineProps = {
  summary: ReferenceFitSummary
  /** 비교한 사이즈 (추천 사이즈) */
  size: string
}

/**
 * 기준 핏 한 줄: 「지금 입는 상의보다 (120 기준)」 + 항목마다 「가슴단면 +1.5cm · 여유 적당」.
 * 다른 칸의 기준 옷으로 대신 비교했으면 너비만 비교했다고 밝힌다
 */
export function ReferenceFitLine({ summary, size }: ReferenceFitLineProps) {
  const { partLabel, isSubstitute, items } = summary
  return (
    <div className="space-y-1 text-[13px]">
      <p className="text-ink-2">
        {isSubstitute ? `지금 입는 ${partLabel}와 너비만 비교하면` : `지금 입는 ${partLabel}보다`}{' '}
        <span className="text-ink-3">
          (<span className="figure">{size}</span> 기준)
        </span>
      </p>
      <ul aria-label="기준 옷과 비교" className="flex flex-wrap gap-x-3 gap-y-1">
        {items.map((item) => (
          <li key={item.label}>
            {item.label} <strong className="figure font-semibold">{item.diffText}</strong>
            {item.judgement && <span className="text-ink-3"> · {item.judgement}</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}
