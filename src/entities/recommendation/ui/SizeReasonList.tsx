import { cn } from '@/shared/lib'
import { SIZE_REASON_LABEL, type SizeReason } from '../model/recommendation'

type SizeReasonListProps = {
  reasons: SizeReason[]
  className?: string
}

/** 사이즈를 고른 근거: 종류 라벨 + 문구(그대로). 근거가 없으면(규칙 추천) 그리지 않고, 모르는 종류는 문구만 */
export function SizeReasonList({ reasons, className }: SizeReasonListProps) {
  if (reasons.length === 0) return null
  return (
    <ul aria-label="추천 근거" className={cn('space-y-1 text-[13px]', className)}>
      {reasons.map((reason) => (
        <li key={`${reason.type}-${reason.detail}`} className="flex gap-2">
          {/* 모르는 종류(null)는 라벨 없이 문구만 (화면에 영어 코드를 보이지 않는다) */}
          {reason.type && (
            <span className="text-ink-3 w-16 shrink-0 font-semibold">
              {SIZE_REASON_LABEL[reason.type]}
            </span>
          )}
          <span className="text-ink-2">{reason.detail}</span>
        </li>
      ))}
    </ul>
  )
}
