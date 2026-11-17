import { cn } from '@/shared/lib'
import { SIZE_REASON_LABEL, type SizeReason } from '../model/recommendation'
import { RISE_STEP_MS } from '../model/use-arrived-after-wait'

type SizeReasonListProps = {
  reasons: SizeReason[]
  /** 기다린 끝에 온 근거: 한 줄씩 아래에서 떠오른다 (동작 줄이기 설정이면 움직이지 않는다) */
  isRising?: boolean
  className?: string
}

/** 사이즈를 고른 근거: 종류 라벨 + 문구(그대로). 근거가 없으면(규칙 추천) 그리지 않고, 모르는 종류는 문구만 */
export function SizeReasonList({ reasons, isRising = false, className }: SizeReasonListProps) {
  if (reasons.length === 0) return null
  return (
    <ul aria-label="추천 근거" className={cn('space-y-1 text-[13px]', className)}>
      {reasons.map((reason, index) => (
        <li
          key={`${reason.type}-${reason.detail}`}
          className={cn('flex gap-2', isRising && 'animate-rise-in motion-reduce:animate-none')}
          style={isRising ? { animationDelay: `${index * RISE_STEP_MS}ms` } : undefined}
        >
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
