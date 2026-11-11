import { cn } from '@/shared/lib'

type RecommendedPicksSkeletonProps = {
  /** 기다리는 동안 보일 안내 (예: 자녀에게 맞는 상품을 고르고 있어요) */
  message: string
  count?: number
  className?: string
}

/**
 * AI 추천을 기다리는 자리: 안내 문구 + 카드 · 이유 칸 모양에 빛이 지나간다.
 * 규칙 결과는 먼저 와도 그리지 않으므로 빈 영역처럼 보이지 않게 한다 (동작 줄이기 설정이면 멈춘다)
 */
export function RecommendedPicksSkeleton({
  message,
  count = 4,
  className,
}: RecommendedPicksSkeletonProps) {
  return (
    <div role="status" aria-label={message} className={cn('space-y-4', className)}>
      <p className="text-ink-2 flex items-center gap-2 text-[13px] font-semibold">
        <span aria-hidden className="flex gap-1">
          {[0, 1, 2].map((dot) => (
            <span
              key={dot}
              className="bg-primary size-1.5 animate-pulse rounded-full motion-reduce:animate-none"
              style={{ animationDelay: `${dot * 200}ms` }}
            />
          ))}
        </span>
        {message}
      </p>
      <div aria-hidden className="grid grid-cols-2 gap-x-3 gap-y-7 md:grid-cols-4 md:gap-x-4">
        {Array.from({ length: count }, (_, index) => (
          <div key={index} className="space-y-2">
            <div className="pick-shimmer rounded-card aspect-[3/4]" />
            <div className="pick-shimmer h-3 w-1/3 rounded" />
            <div className="pick-shimmer h-4 w-3/4 rounded" />
            <div className="pick-shimmer h-4 w-1/2 rounded" />
            <div className="pick-shimmer h-9 w-full rounded-md" />
          </div>
        ))}
      </div>
    </div>
  )
}
