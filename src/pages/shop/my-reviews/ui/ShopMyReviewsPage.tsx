import { Link } from 'react-router'
import { useMyReviewsQuery, useReviewableItemsQuery } from '@/entities/review'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { formatDateTime } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { PageHeader } from '@/shared/ui/PageHeader'
import { ListSkeleton } from '@/shared/ui/Skeleton'
import { StateMessage } from '@/shared/ui/StateMessage'
import { MyReviewItem } from './MyReviewItem'

/** 내 리뷰: 리뷰를 기다리는 상품(구매확정, 아직 안 씀) → 내가 쓴 리뷰(고치기 · 지우기) */
export function ShopMyReviewsPage() {
  const reviewable = useReviewableItemsQuery()
  const mine = useMyReviewsQuery()

  return (
    <div className="shop-look space-y-10">
      <PageHeader title="내 리뷰" />
      <section aria-label="리뷰를 기다리는 상품" className="space-y-3">
        <h2 className="text-section">리뷰를 기다리는 상품</h2>
        {reviewable.isPending ? (
          <ListSkeleton rows={2} />
        ) : reviewable.isError ? (
          <StateMessage tone="error">{getErrorMessage(reviewable.error)}</StateMessage>
        ) : reviewable.data.length === 0 ? (
          <StateMessage>
            리뷰를 쓸 수 있는 상품이 없어요. 구매확정한 상품에 리뷰를 남길 수 있어요.
          </StateMessage>
        ) : (
          <ul className="border-rule divide-rule divide-y rounded-lg border px-4">
            {reviewable.data.map((item) => (
              <li key={item.orderItemId} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="text-sm font-semibold">
                    {item.productName ?? `상품 #${item.productId}`}
                  </p>
                  <p className="text-ink-3 flex flex-wrap gap-x-3 text-[13px]">
                    {item.size && <span>사이즈 {item.size}</span>}
                    <span className="figure">{formatDateTime(item.confirmedAt)} 구매확정</span>
                  </p>
                </div>
                <Link to={paths.shop.reviewWrite(item.orderItemId)} className="shop-btn h-9 px-4">
                  리뷰 쓰기
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="내가 쓴 리뷰" className="space-y-3">
        <h2 className="text-section">내가 쓴 리뷰</h2>
        {mine.isPending ? (
          <ListSkeleton rows={3} />
        ) : mine.isError ? (
          <StateMessage tone="error">{getErrorMessage(mine.error)}</StateMessage>
        ) : mine.data.length === 0 ? (
          <StateMessage>아직 쓴 리뷰가 없어요.</StateMessage>
        ) : (
          <>
            <ul className="border-rule divide-rule divide-y rounded-lg border px-4">
              {mine.data.map((review) => (
                <li key={review.id}>
                  <MyReviewItem review={review} />
                </li>
              ))}
            </ul>
            {mine.hasNextPage && (
              <Button
                variant="outline"
                size="lg"
                disabled={mine.isFetchingNextPage}
                onClick={() => void mine.fetchNextPage()}
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
