import type { ReactNode } from 'react'

type RecommendedPicksNoticeProps = {
  /** 안내 문구 */
  children: ReactNode
  /** 있으면 「다시 불러오기」 버튼을 둔다 (실패했을 때) */
  onRetry?: () => void
}

/** 추천 결과 자리에 남기는 안내 (불러오지 못함 · 함께 볼 상품 없음). 영역을 갑자기 없애지 않는다 */
export function RecommendedPicksNotice({ children, onRetry }: RecommendedPicksNoticeProps) {
  return (
    <div className="bg-paper-2 animate-in fade-in flex flex-col items-center gap-3 rounded-md px-4 py-10 text-center duration-[350ms] motion-reduce:animate-none">
      <p className="text-ink-2 text-sm">{children}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="border-rule hover:bg-paper flex min-h-10 items-center rounded-md border px-4 text-sm font-semibold transition-colors"
        >
          다시 불러오기
        </button>
      )}
    </div>
  )
}
