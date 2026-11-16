import { Link, useSearchParams } from 'react-router'
import {
  ADMIN_REVIEW_STATUSES,
  MODERATION_REASON_LABEL,
  MODERATION_STATUS_LABEL,
  moderationStatusOf,
  useAdminReviewsQuery,
} from '@/entities/review'
import { ModerateReviewButtons } from '@/features/moderate-review'
import { RetryReviewModerationButton } from '@/features/retry-review-moderation'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { cn, formatDateTime } from '@/shared/lib'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { PageHeader } from '@/shared/ui/PageHeader'
import { ListSkeleton } from '@/shared/ui/Skeleton'
import { StateMessage } from '@/shared/ui/StateMessage'

/** 리뷰 검사: 상태 탭(숨김 판단 대기가 먼저) → 리뷰 목록 → 숨김 확정 · 다시 공개 */
export function AdminCommunityReviewsPage() {
  // 상태는 주소(?status=)에 둔다
  const [params, setParams] = useSearchParams()
  const status = moderationStatusOf(params.get('status'))
  const reviews = useAdminReviewsQuery(status)

  return (
    <div className="shop-look space-y-5">
      <PageHeader
        title="리뷰 검사"
        description="리뷰는 저장하면 바로 공개되고, 자동 검사에 걸리면 숨겨져요. 숨겨진 리뷰를 보고 숨김을 확정하거나 다시 공개해요."
        note="GET /admin/community/reviews?status= (BE #1002). 조치는 PATCH …/{reviewId}/visibility {visibility: HIDDEN → CONFIRMED_HIDDEN, VISIBLE → RESTORED}. 같은 값을 다시 보내도 200."
      />
      <div
        role="tablist"
        aria-label="검사 상태"
        className="border-rule flex gap-6 overflow-x-auto border-b"
      >
        {ADMIN_REVIEW_STATUSES.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={status === key}
            onClick={() => setParams({ status: key }, { replace: true })}
            className={cn(
              '-mb-px flex min-h-11 shrink-0 items-center border-b-2 text-[15px] font-bold transition-colors',
              status === key
                ? 'border-ink text-ink'
                : 'text-ink-3 hover:text-ink active:text-ink border-transparent',
            )}
          >
            {MODERATION_STATUS_LABEL[key]}
          </button>
        ))}
      </div>

      {status === 'PENDING' && (
        <div className="bg-paper-2 flex flex-wrap items-center justify-between gap-3 rounded-lg px-4 py-3">
          <p className="text-ink-2 text-[13px]">
            자동 검사가 여러 번 판단하지 못한 리뷰는 공개된 채로 멈춰 있어요. 「다시 검사」를 누르면
            검사 대기로 돌려 다시 검사해요.
          </p>
          <RetryReviewModerationButton />
        </div>
      )}

      <section aria-label="리뷰 목록" className="space-y-3">
        {reviews.isPending ? (
          <ListSkeleton rows={3} />
        ) : reviews.isError ? (
          <StateMessage tone="error">{getErrorMessage(reviews.error)}</StateMessage>
        ) : reviews.data.length === 0 ? (
          <StateMessage>{MODERATION_STATUS_LABEL[status]} 리뷰가 없어요.</StateMessage>
        ) : (
          <>
            <ul className="border-rule divide-rule divide-y rounded-lg border px-4">
              {reviews.data.map((review) => (
                <li key={review.id}>
                  <article aria-label={`리뷰 #${review.id}`} className="space-y-2 py-4">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
                      <span className="font-semibold">리뷰 #{review.id}</span>
                      <Link to={paths.shop.product(review.productId)} className="shop-link">
                        상품 #{review.productId}
                      </Link>
                      {review.reason && (
                        <Badge variant="destructive">
                          {MODERATION_REASON_LABEL[review.reason]}
                        </Badge>
                      )}
                      {review.isAttemptsExhausted && (
                        <Badge variant="highlight">자동 검사 {review.attempts}회 실패</Badge>
                      )}
                      <span className="text-ink-3 figure">
                        {formatDateTime(review.createdAt)} 작성
                        {review.moderatedAt && ` · ${formatDateTime(review.moderatedAt)} 검사`}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-line">{review.content}</p>
                    {review.imageUrls.length > 0 && (
                      <ul className="flex flex-wrap gap-2">
                        {review.imageUrls.map((url, index) => (
                          <li key={url}>
                            <img
                              src={url}
                              alt={`리뷰 #${review.id} 사진 ${index + 1}`}
                              loading="lazy"
                              className="rounded-card bg-muted size-20 object-cover"
                            />
                          </li>
                        ))}
                      </ul>
                    )}
                    <ModerateReviewButtons reviewId={review.id} status={review.status} />
                  </article>
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
                더 보기
              </Button>
            )}
          </>
        )}
      </section>
    </div>
  )
}
