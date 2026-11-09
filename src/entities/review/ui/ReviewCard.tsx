import type { ReactNode } from 'react'
import { formatDateTime } from '@/shared/lib'
import type { Review } from '../model/review'
import { FIT_LABEL } from '../model/review.rules'
import { ReviewStars } from './ReviewStars'

type ReviewCardProps = {
  review: Review
  /** 내 리뷰처럼 여러 상품이 섞인 목록이면 상품 이름 줄 (링크 등) */
  product?: ReactNode
  /** 오른쪽 위 동작 (예: 수정 · 삭제) */
  action?: ReactNode
}

/** 리뷰 한 건: 별점 · 작성자 · 날짜 · 구매 사이즈 · 핏 · 본문 · 사진 */
export function ReviewCard({ review, product, action }: ReviewCardProps) {
  return (
    <article aria-label={`${review.authorName}의 리뷰`} className="space-y-2 py-4">
      {product}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <ReviewStars rating={review.rating} />
        <span className="text-sm font-semibold">{review.authorName}</span>
        <span className="text-ink-3 figure text-xs">
          {formatDateTime(review.createdAt)}
          {review.isEdited && ' (수정됨)'}
        </span>
        {review.isUnderReview && (
          <span className="bg-paper-2 text-ink-2 inline-flex h-5 items-center rounded-sm px-1.5 text-[11px] font-semibold">
            검토 중 · 나에게만 보여요
          </span>
        )}
        {action && <div className="ml-auto flex gap-1">{action}</div>}
      </div>
      {(review.purchasedSize || review.fit) && (
        <p className="text-ink-3 flex flex-wrap gap-x-3 text-[13px]">
          {review.purchasedSize && <span>구매 사이즈 {review.purchasedSize}</span>}
          {review.fit && <span>사이즈 핏 {FIT_LABEL[review.fit]}</span>}
        </p>
      )}
      <p className="text-sm whitespace-pre-line">{review.content}</p>
      {review.imageUrls.length > 0 && (
        <ul aria-label="리뷰 사진" className="flex flex-wrap gap-2">
          {review.imageUrls.map((url, index) => (
            <li key={url}>
              <img
                src={url}
                alt={`리뷰 사진 ${index + 1}`}
                loading="lazy"
                className="bg-paper-2 size-20 rounded-sm object-cover"
              />
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}
