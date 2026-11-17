import { useId, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import {
  AiSentenceNotice,
  AiWaitingNotice,
  FIT_LABEL,
  GrowthOutlook,
  lastPurchaseTextOf,
  referenceFitSummaryOf,
  RISE_STEP_MS,
  showsAiSizeNotice,
  SizeReasonList,
  sizeScaleOf,
  type SizeRange,
  type SizeRecommendation,
} from '@/entities/recommendation'
import { cn } from '@/shared/lib'
import { ReferenceFitLine } from './ReferenceFitLine'

type SizeAdviceProps = {
  /** 고른 자녀 */
  child: { name: string; heightCm: number }
  recommendation: SizeRecommendation
  /** 상품 상세의 사이즈별 권장 키 */
  sizes: SizeRange[]
  /** 착용 미리보기 */
  preview?: ReactNode
  /** 이 상품 구분의 기준 옷이 없을 때 등록하러 가는 링크 (없으면 안내를 숨긴다) */
  referenceGarmentLink?: { label: string; to: string } | null
  /** 규칙 결과를 그린 채 AI 답을 기다리는 중: 근거 자리에 안내 문구를 둔다 */
  isWaitingForAi?: boolean
  /** 기다린 끝에 온 답: 근거 줄과 AI 안내 줄이 한 줄씩 떠오른다 (처음부터 그려진 답은 움직이지 않는다) */
  isArrival?: boolean
}

const AI_WAITING = '아이에게 맞는지 한 번 더 확인하고 있어요'

/**
 * 사이즈 칩 바로 위 추천 한 줄: 「추천 사이즈 120 · 여유 있음 · 김들희 115cm 기준」 + 「사이즈 자세히」.
 * 그 아래 AI 근거(있으면) · AI 안내 · 기준 옷 등록 안내. AI 답을 기다리는 동안에는 근거 자리를 답이 온 뒤의 높이로 잡아 두고 안내 문구를 둔다.
 * 펼치면 백엔드 안내 · 이 상품 사이즈 눈금 · 착용 미리보기.
 * 추천 한 줄 바로 아래에 지난 구매 사이즈, 그 아래(근거 위)에 입을 수 있는 기간 · 성장 속도(예상치), 그 아래 기준 핏(기준 옷과의 cm 차이)을 둔다
 */
export function SizeAdvice({
  child,
  recommendation,
  sizes,
  preview,
  referenceGarmentLink,
  isWaitingForAi = false,
  isArrival = false,
}: SizeAdviceProps) {
  const [isOpen, setIsOpen] = useState(false)
  const detailsId = useId()
  const { recommendedSize, fit, notices, reasons } = recommendation
  const fitSummary = referenceFitSummaryOf(recommendation)
  const lastPurchaseText = lastPurchaseTextOf(recommendation)

  return (
    <div className="border-ink bg-paper border-l-sheet border-[1.5px] border-l-[10px]">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-3.5 py-2.5">
        {recommendedSize ? (
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span className="font-bold">추천 사이즈</span>
            <strong className="font-display bg-[linear-gradient(transparent_55%,var(--fit)_55%)] px-[0.12em] text-[1.7em] leading-none font-normal">
              {recommendedSize}
            </strong>
            {fit && (
              <span
                className={cn(
                  'border-ink bg-paper inline-flex h-5 items-center border px-1.5 text-[11px] font-bold',
                  fit === 'TIGHT' ? 'text-destructive' : 'text-ink',
                )}
              >
                {FIT_LABEL[fit]}
              </span>
            )}
            <span className="text-ink-2 text-[13px]">
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
          className="text-ink flex min-h-9 items-center gap-0.5 text-[13px] font-bold underline-offset-[3px] hover:underline"
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
      {lastPurchaseText && (
        <p className="text-ink-2 px-3.5 pb-2.5 text-[13px]">{lastPurchaseText}</p>
      )}
      {/* 사이즈 무관 · 맞는 사이즈 없음이면 예상치를 보이지 않는다 */}
      {recommendedSize && (
        <div className="px-3.5 pb-2.5">
          <GrowthOutlook recommendation={recommendation} />
        </div>
      )}
      {fitSummary && recommendedSize && (
        <div className="px-3.5 pb-2.5">
          <ReferenceFitLine summary={fitSummary} size={recommendedSize} />
        </div>
      )}
      {/* AI가 고른 근거는 추천 한 줄 바로 아래에 늘 보인다 (규칙 추천이면 없음) */}
      {isWaitingForAi ? (
        // 자리 높이는 근거 세 줄(77px) + AI 안내 줄(26px). 답이 와도 아래 사이즈 버튼이 밀리지 않게 한다.
        // 추천 사이즈가 없으면(사이즈 무관 · 맞는 사이즈 없음) 근거가 붙을 일이 드물어 자리를 잡지 않는다
        <div className={cn('flex items-center px-3.5', recommendedSize ? 'h-[103px]' : 'pb-2.5')}>
          <AiWaitingNotice message={AI_WAITING} isSpacious />
        </div>
      ) : (
        <>
          <SizeReasonList reasons={reasons} isRising={isArrival} className="px-3.5 pb-2.5" />
          {showsAiSizeNotice(recommendation) && (
            <div
              className={cn(
                'px-3.5 pb-2.5',
                isArrival && 'animate-rise-in motion-reduce:animate-none',
              )}
              style={
                isArrival ? { animationDelay: `${reasons.length * RISE_STEP_MS}ms` } : undefined
              }
            >
              <AiSentenceNotice />
            </div>
          )}
        </>
      )}
      {referenceGarmentLink && (
        <p className="text-ink-2 flex flex-wrap items-center gap-x-2 px-3.5 pb-2.5 text-[13px]">
          잘 맞는 옷을 등록하면 더 정확해요
          <Link
            to={referenceGarmentLink.to}
            className="text-ink inline-flex min-h-9 items-center font-bold underline underline-offset-[3px]"
          >
            {referenceGarmentLink.label}
          </Link>
        </p>
      )}
      {isOpen && (
        <div id={detailsId} className="border-ink/30 space-y-4 border-t px-3.5 pt-3 pb-4">
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

/** 이 상품의 사이즈별 권장 키 칸 위에 자녀 키(핀). 추천 칸만 칠한다 */
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
        className="bg-ink text-paper figure absolute top-0 -translate-x-1/2 px-1.5 text-[11px] leading-4 font-bold whitespace-nowrap"
        style={{ left: `${scale.heightPct}%` }}
      >
        {child.heightCm}cm
      </span>
      {scale.segments.map((segment) => (
        <span
          key={segment.size}
          aria-hidden
          className={cn(
            'border-ink absolute top-[22px] h-2.5 border',
            segment.size === recommendedSize ? 'bg-fit' : 'bg-paper',
          )}
          style={{
            left: `calc(${segment.startPct}% + 1.5px)`,
            width: `calc(${segment.endPct - segment.startPct}% - 3px)`,
          }}
        />
      ))}
      <span
        aria-hidden
        className="bg-ink absolute top-4 h-5 w-[2.5px] -translate-x-1/2"
        style={{ left: `${scale.heightPct}%` }}
      />
      {scale.segments.map((segment) => (
        <span
          key={segment.size}
          aria-hidden
          className={cn(
            'figure absolute top-[36px] -translate-x-1/2 text-xs',
            segment.size === recommendedSize
              ? 'text-ink font-bold underline decoration-2 underline-offset-[3px]'
              : 'text-ink-2',
          )}
          style={{ left: `${(segment.startPct + segment.endPct) / 2}%` }}
        >
          {segment.size}
        </span>
      ))}
    </div>
  )
}
