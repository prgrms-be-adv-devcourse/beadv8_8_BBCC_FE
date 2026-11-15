import { AiWaitingNotice, FIT_LABEL, type SizeRecommendation } from '@/entities/recommendation'
import { StateMessage } from '@/shared/ui/StateMessage'

type QuickSizeLineProps = {
  /** 고른 자녀 */
  child: { name: string; heightCm: number }
  recommendation: SizeRecommendation | undefined
  isLoading: boolean
  /** 추천을 불러오지 못했을 때의 문구 */
  errorMessage: string | null
  isWaitingForAi: boolean
}

/** 담기 팝업의 추천 한 줄: 「추천 사이즈 120 · 적정 · 김들희 115cm 기준」. 값을 대신 고르지는 않는다 */
export function QuickSizeLine({
  child,
  recommendation,
  isLoading,
  errorMessage,
  isWaitingForAi,
}: QuickSizeLineProps) {
  // 첫 결과(보통 규칙 결과) 전까지만. 그 뒤 AI 답을 기다리는 동안은 추천을 그린 채 AI 대기를 보인다
  if (isLoading) return <StateMessage>추천 계산 중…</StateMessage>
  if (errorMessage) return <StateMessage tone="error">{errorMessage}</StateMessage>
  if (!recommendation) return null
  const { recommendedSize, fit, notices } = recommendation
  return (
    <div
      data-clarity-mask="true"
      className="border-ink bg-paper border-l-sheet space-y-1.5 border-[1.5px] border-l-[10px] px-3.5 py-2.5"
    >
      {recommendedSize ? (
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
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
        <p className="text-sm font-semibold">{notices[0]?.message ?? '맞는 사이즈가 없어요.'}</p>
      )}
      {isWaitingForAi && <AiWaitingNotice message="AI가 사이즈를 더 살펴보고 있어요" />}
    </div>
  )
}
