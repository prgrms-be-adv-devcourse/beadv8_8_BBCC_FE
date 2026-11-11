import { cn } from '@/shared/lib'

type AiSentenceNoticeProps = {
  className?: string
}

/** AI가 쓴 추천 문장 아래 안내 한 줄 (홈 맛보기 이유 · 상품 상세 사이즈 근거가 같은 문구) */
export function AiSentenceNotice({ className }: AiSentenceNoticeProps) {
  return (
    <p className={cn('text-ink-3 flex items-center gap-1.5 text-xs', className)}>
      <svg
        viewBox="0 0 24 24"
        className="size-3.5 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5M12 8h.01" />
      </svg>
      AI를 활용한 문장이라 실수가 있을 수 있어요.
    </p>
  )
}
