import { getErrorMessage, getErrorStatus, getErrorTitle, isErrorCode } from '@/shared/api'
import type { Fit, FitCounts, Review, ReviewAction, ReviewDraft, ReviewDraftErrors } from './review'

/** 계약 값 (BE Review: 별점 1~5 정수, 본문 앞뒤 공백 제외 1~1000자 · community.yml max-count 5) */
export const REVIEW_RATING_MAX = 5
export const REVIEW_CONTENT_MAX = 1000
export const REVIEW_IMAGE_MAX_COUNT = 5

export const FITS: readonly Fit[] = ['SMALL', 'TRUE_TO_SIZE', 'LARGE']
export const FIT_LABEL: Record<Fit, string> = {
  SMALL: '작아요',
  TRUE_TO_SIZE: '잘 맞아요',
  LARGE: '커요',
}

export const EMPTY_REVIEW_DRAFT: ReviewDraft = {
  rating: null,
  fit: null,
  content: '',
  imageUrls: [],
}

/** 사이즈가 있는 상품만 핏을 남길 수 있다 (없는데 보내면 BE 400 FIT_NOT_APPLICABLE) */
export function canChooseFit(size: string | null): boolean {
  return size !== null
}

export function validateReviewDraft(draft: ReviewDraft, isFitAllowed: boolean): ReviewDraftErrors {
  const errors: ReviewDraftErrors = {}
  const { rating } = draft
  if (rating === null) errors.rating = '별점을 골라 주세요.'
  else if (!Number.isInteger(rating) || rating < 1 || rating > REVIEW_RATING_MAX)
    errors.rating = `별점은 1~${REVIEW_RATING_MAX}점이에요.`
  const length = draft.content.trim().length
  if (length === 0) errors.content = '내용을 적어 주세요.'
  else if (length > REVIEW_CONTENT_MAX)
    errors.content = `내용은 ${REVIEW_CONTENT_MAX}자까지 쓸 수 있어요.`
  if (draft.fit !== null && !isFitAllowed) errors.fit = '사이즈가 없는 상품은 핏을 고를 수 없어요.'
  if (draft.imageUrls.length > REVIEW_IMAGE_MAX_COUNT)
    errors.imageUrls = `사진은 ${REVIEW_IMAGE_MAX_COUNT}장까지 올릴 수 있어요.`
  return errors
}

export function hasDraftErrors(errors: ReviewDraftErrors): boolean {
  return Object.keys(errors).length > 0
}

export function draftOf(review: Review): ReviewDraft {
  return {
    rating: review.rating,
    fit: review.fit,
    content: review.content,
    imageUrls: review.imageUrls,
  }
}

/** 핏 분포 막대: 작아요 · 잘 맞아요 · 커요 순서, 핏을 남긴 리뷰 중 비율(반올림 %) */
export function fitShares(counts: FitCounts) {
  const total = FITS.reduce((sum, fit) => sum + counts[fit], 0)
  return FITS.map((fit) => ({
    fit,
    label: FIT_LABEL[fit],
    count: counts[fit],
    percent: total === 0 ? 0 : Math.round((counts[fit] / total) * 100),
  }))
}

export function averageRatingLabel(average: number | null): string {
  return average === null ? '-' : average.toFixed(1)
}

/**
 * 주문상품 줄의 리뷰 동작. 구매확정한 주문상품만:
 * 이미 썼으면 작성 완료, 작성 가능 목록에 있으면 쓰기, 둘 다 아니면 준비 중 (커뮤니티가 구매확정 이벤트를 아직 받지 못함)
 */
export function reviewActionOf(
  item: { id: string; status: string },
  reviewableIds: ReadonlySet<string>,
  reviewedIds: ReadonlySet<string>,
): ReviewAction | null {
  if (item.status !== 'CONFIRMED') return null
  if (reviewedIds.has(item.id)) return 'written'
  return reviewableIds.has(item.id) ? 'write' : 'preparing'
}

/** BE ReviewErrorCode.IMAGE_NOT_UPLOADED. title은 code가 없는 응답(BE #1326 배포 전)에서만 쓴다 */
const IMAGE_NOT_UPLOADED = {
  code: 'IMAGE_NOT_UPLOADED',
  legacyTitle: '올리지 않은 사진입니다',
} as const

/**
 * 리뷰 쓰기 · 고치기 오류 문구. 기본은 ProblemDetail detail 그대로.
 * 올리지 않은 사진(400)은 개발자용 detail 대신 다시 올리기 안내, ProblemDetail이 없는 503(배포 중 등)은 잠시 뒤 다시
 */
export function reviewSaveErrorMessage(error: unknown): string {
  const status = getErrorStatus(error)
  if (status === 400 && isErrorCode(error, IMAGE_NOT_UPLOADED.code, IMAGE_NOT_UPLOADED.legacyTitle))
    return '사진이 다 올라가지 않았어요. 그 사진을 지우고 다시 올려 주세요.'
  if (status === 503 && getErrorTitle(error) === null)
    return '서버가 잠시 응답하지 않아요. 잠시 뒤 다시 시도해 주세요.'
  return getErrorMessage(error)
}
