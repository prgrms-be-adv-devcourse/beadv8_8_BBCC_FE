import { cn } from '@/shared/lib'

type RecommendedPicksLoadingProps = {
  /** 기다리는 동안의 안내 (화면 읽기 프로그램용 이름. 눈에 보이는 문구는 제목 옆에 둔다) */
  message: string
  count?: number
  className?: string
}

/**
 * 추천 첫 결과(보통 규칙 결과)를 기다리는 자리: 카드 칸마다 원형 로딩. 빈 영역처럼 보이지 않게 한다.
 * 동작 줄이기 설정이면 천천히 돈다
 */
export function RecommendedPicksLoading({
  message,
  count = 4,
  className,
}: RecommendedPicksLoadingProps) {
  return (
    <div
      role="status"
      aria-label={message}
      className={cn('grid grid-cols-2 gap-x-3 gap-y-7 md:grid-cols-4 md:gap-x-4', className)}
    >
      {Array.from({ length: count }, (_, index) => (
        <div key={index} aria-hidden className="space-y-2">
          <div className="bg-paper-2 rounded-card flex aspect-[3/4] items-center justify-center">
            <span className="border-rule border-t-primary size-7 animate-spin rounded-full border-[3px] motion-reduce:[animation-duration:2.5s]" />
          </div>
          <div className="bg-paper-2 h-3 w-1/3 rounded" />
          <div className="bg-paper-2 h-4 w-3/4 rounded" />
          <div className="bg-paper-2 h-4 w-1/2 rounded" />
        </div>
      ))}
    </div>
  )
}
