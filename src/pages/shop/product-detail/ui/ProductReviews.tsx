import {
  ReviewCard,
  ReviewSummaryCard,
  useProductReviewsQuery,
  useReviewSummaryQuery,
} from '@/entities/review'
import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { ListSkeleton } from '@/shared/ui/Skeleton'
import { StateMessage } from '@/shared/ui/StateMessage'

type ProductReviewsProps = { productId: string }

/** 상품 상세 리뷰: 요약(평균 · 수 · 핏 분포) → 최신순 목록, 「더 보기」로 이어 붙인다 */
export function ProductReviews({ productId }: ProductReviewsProps) {
  const summary = useReviewSummaryQuery(productId)
  const reviews = useProductReviewsQuery(productId)
  const count = summary.data?.count

  return (
    <section aria-label="리뷰" className="space-y-4">
      <h2 className="text-section">
        리뷰
        {count !== undefined && <span className="text-ink-3 figure ml-2 text-sm">{count}</span>}
      </h2>
      {summary.isError && (
        <StateMessage tone="error">{getErrorMessage(summary.error)}</StateMessage>
      )}
      {summary.data && summary.data.count > 0 && <ReviewSummaryCard summary={summary.data} />}
      {reviews.isPending ? (
        <ListSkeleton rows={2} />
      ) : reviews.isError ? (
        <StateMessage tone="error">{getErrorMessage(reviews.error)}</StateMessage>
      ) : reviews.data.length === 0 ? (
        <div className="border-rule space-y-1 rounded-lg border p-5 text-center">
          <p className="font-semibold">첫 리뷰를 남겨 주세요</p>
          <p className="text-ink-3 text-[13px]">
            구매확정한 뒤 주문 상세나 마이페이지 내 리뷰에서 쓸 수 있어요.
          </p>
        </div>
      ) : (
        <>
          <ul className="divide-rule divide-y">
            {reviews.data.map((review) => (
              <li key={review.id}>
                <ReviewCard review={review} />
              </li>
            ))}
          </ul>
          {reviews.hasNextPage && (
            <Button
              variant="outline"
              size="lg"
              disabled={reviews.isFetchingNextPage}
              onClick={() => void reviews.fetchNextPage()}
            >
              리뷰 더 보기
            </Button>
          )}
        </>
      )}
    </section>
  )
}
