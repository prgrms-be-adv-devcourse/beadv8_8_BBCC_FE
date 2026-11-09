import { cn } from '@/shared/lib'
import { REVIEW_RATING_MAX } from '../model/review.rules'

type ReviewStarsProps = {
  /** 0~5 (평균은 소수도 된다: 반올림한 칸까지 채운다) */
  rating: number
  className?: string
}

/** 별점 표시 (읽기 전용) */
export function ReviewStars({ rating, className }: ReviewStarsProps) {
  const filled = Math.round(rating)
  return (
    <span
      role="img"
      aria-label={`별점 ${rating}점`}
      className={cn('inline-flex text-[#F4D35E]', className)}
    >
      {Array.from({ length: REVIEW_RATING_MAX }, (_, index) => (
        <span key={index} aria-hidden className={index < filled ? undefined : 'text-ink-3/30'}>
          ★
        </span>
      ))}
    </span>
  )
}
