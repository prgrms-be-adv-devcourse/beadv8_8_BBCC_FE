import { AiWaitingNotice, FIT_LABEL, type SizeRecommendation } from '@/entities/recommendation'
import { cn } from '@/shared/lib'
import { StateMessage } from '@/shared/ui/StateMessage'

type QuickSizeLineProps = {
  /** 고른 자녀 */
  child: { name: string; heightCm: number }
  recommendation: SizeRecommendation | undefined
  /** 첫 결과 전이거나 AI 답을 기다리는 중 */
  isWaiting: boolean
  /** 기다린 끝에 온 답: 추천 한 줄이 떠오른다 (처음부터 그려진 답은 움직이지 않는다) */
  isArrival: boolean
  /** 추천을 불러오지 못했을 때의 문구 */
  errorMessage: string | null
}

// 기다리는 칸과 추천 한 줄이 같은 모양 · 높이라, 답이 와도 아래 사이즈 버튼과 팝업 높이가 바뀌지 않는다
const BOX =
  'border-ink bg-paper border-l-sheet flex min-h-12 items-center border-[1.5px] border-l-[10px] px-3.5 py-2.5'

/**
 * 담기 팝업의 추천 한 줄: 「추천 사이즈 120 · 적정 · 김들희 115cm 기준」. 값을 대신 고르지는 않는다.
 * AI 답이 오거나 스트림이 닫힐 때까지는 같은 칸에 「추천 계산 중」만 보인다
 */
export function QuickSizeLine({
  child,
  recommendation,
  isWaiting,
  isArrival,
  errorMessage,
}: QuickSizeLineProps) {
  if (isWaiting) {
    return (
      <div className={BOX}>
        <AiWaitingNotice message="추천 계산 중" isSpacious />
      </div>
    )
  }
  if (errorMessage) return <StateMessage tone="error">{errorMessage}</StateMessage>
  if (!recommendation) return null
  const { recommendedSize, fit, notices } = recommendation
  const rising = isArrival && 'animate-rise-in motion-reduce:animate-none'
  return (
    <div data-clarity-mask="true" className={BOX}>
      {recommendedSize ? (
        <p className={cn('flex flex-wrap items-center gap-x-2 gap-y-1 text-sm', rising)}>
          <span className="font-bold">추천 사이즈</span>
          <strong className="font-display bg-[linear-gradient(transparent_55%,var(--fit)_55%)] px-[0.12em] text-[1.7em] leading-none font-normal">
            {recommendedSize}
          </strong>
          {fit && (
            <span className="border-ink bg-paper inline-flex h-5 items-center border px-1.5 text-[11px] font-bold">
              {FIT_LABEL[fit]}
            </span>
          )}
          <span className="text-ink-2 text-[13px]">
            {child.name} <span className="figure">{child.heightCm}cm</span> 기준
          </span>
        </p>
      ) : (
        // 사이즈 무관 · 맞는 사이즈 없음: 백엔드 안내 문구가 곧 결과
        <p className={cn('text-sm font-semibold', rising)}>
          {notices[0]?.message ?? '맞는 사이즈가 없어요.'}
        </p>
      )}
    </div>
  )
}
