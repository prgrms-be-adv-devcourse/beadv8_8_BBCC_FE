import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import {
  canChooseFit,
  EMPTY_REVIEW_DRAFT,
  hasDraftErrors,
  ReviewCard,
  ReviewForm,
  reviewSaveErrorMessage,
  useReviewableItemQuery,
  validateReviewDraft,
  type Review,
} from '@/entities/review'
import { ReviewImageUploader } from '@/features/upload-review-image'
import { useWriteReview } from '@/features/write-review'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { formatDateTime } from '@/shared/lib'
import { PageHeader } from '@/shared/ui/PageHeader'
import { ListSkeleton } from '@/shared/ui/Skeleton'
import { StateMessage } from '@/shared/ui/StateMessage'

/** 리뷰 쓰기: 구매확정한 주문상품 하나 (주문 상세 · 내 리뷰에서 들어온다) */
export function ShopReviewWritePage() {
  const [search] = useSearchParams()
  const orderItemId = search.get('orderItemId') ?? ''
  const reviewable = useReviewableItemQuery(orderItemId)
  const [draft, setDraft] = useState(EMPTY_REVIEW_DRAFT)
  const [isTried, setIsTried] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [written, setWritten] = useState<Review | null>(null)
  const write = useWriteReview(orderItemId, { onWritten: setWritten })

  if (written) return <WrittenReview review={written} />
  if (reviewable.isPending) return <ListSkeleton rows={3} />
  if (reviewable.isError)
    return <StateMessage tone="error">{getErrorMessage(reviewable.error)}</StateMessage>

  const item = reviewable.item
  // 409(이미 씀)면 목록을 다시 불러 item이 사라지므로, 서버 안내를 이 화면에서 보여 준다
  if (!item || write.isAlreadyWritten)
    return (
      <div className="shop-look space-y-3">
        <PageHeader title="리뷰 쓰기" />
        {write.isAlreadyWritten ? (
          <p role="alert" className="text-destructive text-sm">
            {getErrorMessage(write.error)}
          </p>
        ) : (
          <StateMessage>
            리뷰를 쓸 수 있는 상품이 아니에요. 이미 리뷰를 썼거나, 아직 구매확정 전이에요.
          </StateMessage>
        )}
        <p className="flex gap-6 text-sm">
          <Link to={paths.shop.reviews} className="shop-link">
            내 리뷰 보기
          </Link>
          <Link to={paths.shop.orders} className="shop-link">
            주문 내역
          </Link>
        </p>
      </div>
    )

  const isFitAllowed = canChooseFit(item.size)
  const errors = validateReviewDraft(draft, isFitAllowed)
  const handleSubmit = () => {
    setIsTried(true)
    if (!hasDraftErrors(errors)) write.write(draft)
  }

  return (
    <div className="shop-look mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="리뷰 쓰기"
        note="POST /reviews → 커뮤니티가 구매확정 자격을 확인하고 리뷰를 저장, 상품 리뷰 수 · 평균 별점을 같은 트랜잭션에서 올린다"
      />
      <section aria-label="리뷰할 상품" className="border-rule space-y-1 rounded-lg border p-4">
        <p className="font-semibold">{item.productName ?? `상품 #${item.productId}`}</p>
        <p className="text-ink-3 flex flex-wrap gap-x-3 text-[13px]">
          {item.size && <span>구매 사이즈 {item.size}</span>}
          <span className="figure">{formatDateTime(item.confirmedAt)} 구매확정</span>
        </p>
      </section>
      <ReviewForm
        draft={draft}
        onChange={setDraft}
        isFitAllowed={isFitAllowed}
        errors={isTried ? errors : {}}
        photos={
          <ReviewImageUploader
            value={draft.imageUrls}
            onChange={(imageUrls) => setDraft((prev) => ({ ...prev, imageUrls }))}
            onUploadingChange={setIsUploading}
          />
        }
        submitLabel="리뷰 남기기"
        isSubmitting={write.isPending}
        isSubmitDisabled={isUploading}
        onSubmit={handleSubmit}
      />
      {write.isError && (
        <p role="alert" className="text-destructive text-sm">
          {reviewSaveErrorMessage(write.error)}
        </p>
      )}
    </div>
  )
}

type WrittenReviewProps = { review: Review }

/** 남긴 리뷰를 그대로 보여 주고, 상품 상세 · 내 리뷰로 이어 준다 */
function WrittenReview({ review }: WrittenReviewProps) {
  return (
    <div className="shop-look mx-auto max-w-2xl space-y-4">
      <PageHeader title="리뷰를 남겼어요" />
      <section aria-label="남긴 리뷰" className="border-rule rounded-lg border px-4">
        <ReviewCard review={review} />
      </section>
      <p className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <Link to={paths.shop.product(review.productId)} className="shop-link">
          상품 상세에서 보기
        </Link>
        <Link to={paths.shop.reviews} className="shop-link">
          내 리뷰
        </Link>
      </p>
    </div>
  )
}
