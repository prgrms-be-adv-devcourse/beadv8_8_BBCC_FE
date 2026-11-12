import { useState } from 'react'
import { Link } from 'react-router'
import {
  canChooseFit,
  draftOf,
  hasDraftErrors,
  ReviewCard,
  ReviewForm,
  reviewSaveErrorMessage,
  validateReviewDraft,
  type Review,
} from '@/entities/review'
import { useEditReview } from '@/features/edit-review'
import { ReviewImageUploader } from '@/features/upload-review-image'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { confirmAction } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/StateMessage'

type MyReviewItemProps = { review: Review }

/** 내가 쓴 리뷰 한 건: 보기 ↔ 고치기 */
export function MyReviewItem({ review }: MyReviewItemProps) {
  const [draft, setDraft] = useState(() => draftOf(review))
  const [isEditing, setIsEditing] = useState(false)
  const [isTried, setIsTried] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const { update, remove } = useEditReview(review, { onSaved: () => setIsEditing(false) })
  const productName = review.productName ?? `상품 #${review.productId}`
  const product = (
    <Link
      to={paths.shop.product(review.productId)}
      className="text-sm font-semibold hover:underline"
    >
      {productName}
    </Link>
  )

  if (isEditing) {
    const isFitAllowed = canChooseFit(review.purchasedSize)
    const errors = validateReviewDraft(draft, isFitAllowed)
    return (
      <div className="space-y-3 py-4" aria-label={`${productName} 리뷰 고치기`}>
        {product}
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
          submitLabel="고친 내용 저장"
          isSubmitting={update.isPending}
          isSubmitDisabled={isUploading}
          onSubmit={() => {
            setIsTried(true)
            if (!hasDraftErrors(errors) && !update.isPending) update.mutate(draft)
          }}
          onCancel={() => {
            setDraft(draftOf(review))
            setIsTried(false)
            setIsEditing(false)
          }}
        />
        {update.isError && (
          <StateMessage tone="error">{reviewSaveErrorMessage(update.error)}</StateMessage>
        )}
      </div>
    )
  }

  const handleRemove = async () => {
    if (
      await confirmAction({
        title: '리뷰를 지울까요?',
        description: '지운 리뷰는 되살릴 수 없어요. 리뷰는 다시 쓸 수 있어요.',
        confirmLabel: '지우기',
      })
    )
      remove.mutate()
  }

  return (
    <>
      <ReviewCard
        review={review}
        product={product}
        action={
          <>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setDraft(draftOf(review))
                setIsEditing(true)
              }}
            >
              고치기
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive"
              disabled={remove.isPending}
              onClick={() => void handleRemove()}
            >
              지우기
            </Button>
          </>
        }
      />
      {remove.isError && <StateMessage tone="error">{getErrorMessage(remove.error)}</StateMessage>}
    </>
  )
}
