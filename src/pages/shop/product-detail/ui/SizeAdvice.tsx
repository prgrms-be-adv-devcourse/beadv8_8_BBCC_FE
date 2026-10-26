import { useId, useState, type ReactNode } from 'react'
import {
  FIT_LABEL,
  sizeScaleOf,
  type SizeRange,
  type SizeRecommendation,
} from '@/entities/recommendation'
import { cn } from '@/shared/lib'

type SizeAdviceProps = {
  /** 고른 자녀 */
  child: { name: string; heightCm: number }
  recommendation: SizeRecommendation
  /** 상품 상세의 사이즈별 권장 키 */
  sizes: SizeRange[]
  /** 착용 미리보기 */
  preview?: ReactNode
}

/**
 * 사이즈 칩 바로 위 추천 한 줄: 「추천 사이즈 120 · 여유 있음 · 김들희 115cm 기준」 + 「사이즈 자세히」.
 * 펼치면 백엔드 안내 · 이 상품 사이즈 눈금 · 착용 미리보기
 */
export function SizeAdvice({ child, recommendation, sizes, preview }: SizeAdviceProps) {
  const [isOpen, setIsOpen] = useState(false)
  const detailsId = useId()
  const { recommendedSize, fit, notices } = recommendation

  return (
    <div className="bg-paper-2 rounded-md">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-3.5 py-2.5">
        {recommendedSize ? (
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span className="text-ink-2">추천 사이즈</span>
            <strong className="text-fit-ink figure text-lg leading-none font-bold">
              {recommendedSize}
            </strong>
            {fit && (
              <span
                className={cn(
                  'inline-flex h-5 items-center rounded-sm px-1.5 text-[11px] font-semibold',
                  fit === 'TIGHT' ? 'bg-paper text-destructive' : 'bg-signal-soft text-signal',
                )}
              >
                {FIT_LABEL[fit]}
              </span>
            )}
            <span className="text-ink-3 text-[13px]">
              {child.name} <span className="figure">{child.heightCm}cm</span> 기준
            </span>
          </p>
        ) : (
          // 사이즈 무관 · 맞는 사이즈 없음: 백엔드 안내 문구가 곧 결과
          <p className="text-sm font-semibold">{notices[0]?.message ?? '맞는 사이즈가 없어요.'}</p>
        )}
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={detailsId}
          onClick={() => setIsOpen((open) => !open)}
          className="text-ink-2 hover:text-ink flex min-h-9 items-center gap-0.5 rounded-md text-[13px] font-semibold transition-colors"
        >
          사이즈 자세히
          <svg
            viewBox="0 0 24 24"
            className={cn('size-4 transition-transform', isOpen && 'rotate-180')}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>
      {isOpen && (
        <div id={detailsId} className="border-rule space-y-4 border-t px-3.5 pt-3 pb-4">
          {recommendedSize && notices[0] && (
            <p className="text-ink-2 text-[13px]">{notices[0].message}</p>
          )}
          {sizes.length > 0 && (
            <SizeScaleBar sizes={sizes} child={child} recommendedSize={recommendedSize} />
          )}
          {preview}
        </div>
      )}
    </div>
  )
}

type SizeScaleBarProps = {
  sizes: SizeRange[]
  child: { name: string; heightCm: number }
  recommendedSize: string | null
}

/** 이 상품의 사이즈별 권장 키 칸 위에 자녀 키(자두 핀). 추천 칸만 코랄 */
function SizeScaleBar({ sizes, child, recommendedSize }: SizeScaleBarProps) {
  const scale = sizeScaleOf(sizes, child.heightCm)
  return (
    <div
      role="img"
      aria-label={`이 상품 사이즈별 권장 키 위에 ${child.name} 키 ${child.heightCm}cm`}
      className="relative h-14 w-full select-none"
    >
      <span
        aria-hidden
        className="text-signal figure absolute top-0 -translate-x-1/2 text-[11px] font-bold whitespace-nowrap"
        style={{ left: `${scale.heightPct}%` }}
      >
        {child.heightCm}cm
      </span>
      {scale.segments.map((segment) => (
        <span
          key={segment.size}
          aria-hidden
          className={cn(
            'absolute top-[22px] h-2 rounded-full',
            segment.size === recommendedSize ? 'bg-fit' : 'bg-paper-3',
          )}
          style={{
            left: `calc(${segment.startPct}% + 1.5px)`,
            width: `calc(${segment.endPct - segment.startPct}% - 3px)`,
          }}
        />
      ))}
      <span
        aria-hidden
        className="bg-signal ring-paper-2 absolute top-[17px] h-[18px] w-[3px] -translate-x-1/2 rounded-full ring-2"
        style={{ left: `${scale.heightPct}%` }}
      />
      {scale.segments.map((segment) => (
        <span
          key={segment.size}
          aria-hidden
          className={cn(
            'figure absolute top-[36px] -translate-x-1/2 text-xs',
            segment.size === recommendedSize ? 'text-fit-ink font-bold' : 'text-ink-3',
          )}
          style={{ left: `${(segment.startPct + segment.endPct) / 2}%` }}
        >
          {segment.size}
        </span>
      ))}
    </div>
  )
}
