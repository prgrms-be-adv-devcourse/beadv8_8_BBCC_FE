import type { FormEvent, ReactNode } from 'react'
import { cn } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/input'
import type { Fit, ReviewDraft, ReviewDraftErrors } from '../model/review'
import { FIT_LABEL, FITS, REVIEW_CONTENT_MAX, REVIEW_RATING_MAX } from '../model/review.rules'

type ReviewFormProps = {
  draft: ReviewDraft
  onChange: (draft: ReviewDraft) => void
  /** 사이즈 있는 상품만 핏을 고른다 */
  isFitAllowed: boolean
  /** 한 번 제출해 본 뒤에만 넘긴다 (처음부터 빨갛지 않게) */
  errors: ReviewDraftErrors
  /** 사진 칸 (업로드 기능을 페이지가 끼운다) */
  photos?: ReactNode
  submitLabel: string
  isSubmitting: boolean
  /** 사진을 올리는 중 등 제출을 막을 때 */
  isSubmitDisabled?: boolean
  onSubmit: () => void
  onCancel?: () => void
}

const choiceClass = (isActive: boolean) =>
  cn(
    'inline-flex h-10 min-w-11 items-center justify-center rounded-full border px-3.5 text-sm font-semibold transition-colors',
    isActive ? 'border-primary bg-primary text-primary-foreground' : 'border-rule text-ink-2',
  )

/** 리뷰 쓰기 · 고치기 입력: 별점 → 사이즈 핏 → 내용 → 사진 */
export function ReviewForm({
  draft,
  onChange,
  isFitAllowed,
  errors,
  photos,
  submitLabel,
  isSubmitting,
  isSubmitDisabled,
  onSubmit,
  onCancel,
}: ReviewFormProps) {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    onSubmit()
  }
  const setFit = (fit: Fit) => onChange({ ...draft, fit: draft.fit === fit ? null : fit })
  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">별점</legend>
        <div role="radiogroup" aria-label="별점" className="flex flex-wrap gap-1.5">
          {Array.from({ length: REVIEW_RATING_MAX }, (_, index) => index + 1).map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={draft.rating === value}
              aria-label={`${value}점`}
              className={choiceClass(draft.rating !== null && value <= draft.rating)}
              onClick={() => onChange({ ...draft, rating: value })}
            >
              ★ {value}
            </button>
          ))}
        </div>
        {errors.rating && <p className="text-destructive text-sm">{errors.rating}</p>}
      </fieldset>

      {isFitAllowed && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold">
            사이즈 핏 <span className="text-ink-3 font-normal">(선택)</span>
          </legend>
          <div role="radiogroup" aria-label="사이즈 핏" className="flex flex-wrap gap-1.5">
            {FITS.map((fit) => (
              <button
                key={fit}
                type="button"
                role="radio"
                aria-checked={draft.fit === fit}
                className={choiceClass(draft.fit === fit)}
                onClick={() => setFit(fit)}
              >
                {FIT_LABEL[fit]}
              </button>
            ))}
          </div>
          {errors.fit && <p className="text-destructive text-sm">{errors.fit}</p>}
        </fieldset>
      )}

      <div className="space-y-2">
        <Label htmlFor="review-content" className="text-sm font-semibold">
          내용
        </Label>
        <Textarea
          id="review-content"
          rows={5}
          value={draft.content}
          aria-invalid={Boolean(errors.content)}
          placeholder="사이즈 · 소재 · 아이 반응을 남겨 주세요."
          onChange={(event) => onChange({ ...draft, content: event.target.value })}
          className="text-base"
        />
        <p className="text-ink-3 figure text-right text-xs">
          {draft.content.trim().length} / {REVIEW_CONTENT_MAX}
        </p>
        {errors.content && <p className="text-destructive text-sm">{errors.content}</p>}
      </div>

      {photos}
      {errors.imageUrls && <p className="text-destructive text-sm">{errors.imageUrls}</p>}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="lg" disabled={isSubmitting || isSubmitDisabled}>
          {isSubmitting ? '보내는 중…' : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" size="lg" variant="outline" onClick={onCancel}>
            취소
          </Button>
        )}
      </div>
    </form>
  )
}
