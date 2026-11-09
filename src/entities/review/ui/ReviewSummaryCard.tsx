import type { ReviewSummary } from '../model/review'
import { averageRatingLabel, fitShares } from '../model/review.rules'
import { ReviewStars } from './ReviewStars'

type ReviewSummaryCardProps = { summary: ReviewSummary }

/** 상품 리뷰 요약: 평균 별점 · 리뷰 수 · 사이즈 핏 분포 */
export function ReviewSummaryCard({ summary }: ReviewSummaryCardProps) {
  const shares = fitShares(summary.fit)
  const hasFit = shares.some((share) => share.count > 0)
  return (
    <section
      aria-label="리뷰 요약"
      className="border-rule grid gap-5 rounded-lg border p-5 sm:grid-cols-[10rem_minmax(0,1fr)]"
    >
      <div className="space-y-1">
        <p className="figure text-3xl font-bold">{averageRatingLabel(summary.averageRating)}</p>
        <ReviewStars rating={summary.averageRating ?? 0} className="text-lg" />
        <p className="text-ink-3 figure text-[13px]">리뷰 {summary.count}개</p>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-semibold">사이즈 핏</p>
        {hasFit ? (
          <ul aria-label="사이즈 핏 분포" className="space-y-1.5">
            {shares.map((share) => (
              <li
                key={share.fit}
                aria-label={`${share.label} ${share.percent}%`}
                className="grid grid-cols-[4.5rem_minmax(0,1fr)_3rem] items-center gap-2 text-[13px]"
              >
                <span className="text-ink-2">{share.label}</span>
                <span className="bg-paper-2 h-2 overflow-hidden rounded-full">
                  <span
                    className="bg-primary block h-full rounded-full"
                    style={{ width: `${share.percent}%` }}
                  />
                </span>
                <span className="figure text-ink-3 text-right">{share.percent}%</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-ink-3 text-[13px]">아직 사이즈 핏을 남긴 리뷰가 없어요.</p>
        )}
      </div>
    </section>
  )
}
