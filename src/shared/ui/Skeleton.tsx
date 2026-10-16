import { cn } from '@/shared/lib'

type SkeletonProps = { className?: string }

/** 불러오는 동안 자리 모양 */
export function Skeleton({ className }: SkeletonProps) {
  return <div aria-hidden className={cn('bg-muted animate-pulse rounded-md', className)} />
}

type CardGridSkeletonProps = { count?: number; className?: string }

/** 상품 카드 격자 자리 (목록 불러오는 중) */
export function CardGridSkeleton({ count = 8, className }: CardGridSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="불러오는 중"
      className={cn('grid grid-cols-2 gap-4 md:grid-cols-4', className)}
    >
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="space-y-2 rounded-2xl border bg-white p-2.5">
          <Skeleton className="aspect-square rounded-xl" />
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  )
}

type ListSkeletonProps = { rows?: number }

/** 목록 줄 자리 (장바구니 · 주문 목록 불러오는 중) */
export function ListSkeleton({ rows = 3 }: ListSkeletonProps) {
  return (
    <div role="status" aria-label="불러오는 중" className="space-y-3">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-3 rounded-xl border bg-white p-4">
          <Skeleton className="size-14 shrink-0 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}
