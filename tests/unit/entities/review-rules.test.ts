import { describe, expect, it } from 'vitest'
import {
  averageRatingLabel,
  canChooseFit,
  draftOf,
  EMPTY_REVIEW_DRAFT,
  fitShares,
  hasDraftErrors,
  reviewActionOf,
  validateReviewDraft,
  type Review,
} from '@/entities/review'

// 계약: BE Review(별점 1~5 정수, 본문 앞뒤 공백 제외 1~1000자, 핏은 사이즈 있는 상품만) · 사진 최대 5장(community.yml max-count)

const draft = { rating: 5, fit: null, content: '좋아요', imageUrls: [] }

describe('validateReviewDraft', () => {
  it('별점 1~5 정수만', () => {
    expect(validateReviewDraft({ ...draft, rating: null }, true).rating).toBe('별점을 골라 주세요.')
    expect(validateReviewDraft({ ...draft, rating: 0 }, true).rating).toBeDefined()
    expect(validateReviewDraft({ ...draft, rating: 6 }, true).rating).toBeDefined()
    expect(validateReviewDraft({ ...draft, rating: 4.5 }, true).rating).toBeDefined()
    expect(validateReviewDraft({ ...draft, rating: 1 }, true).rating).toBeUndefined()
    expect(validateReviewDraft({ ...draft, rating: 5 }, true).rating).toBeUndefined()
  })

  it('본문은 앞뒤 공백을 빼고 1~1000자', () => {
    expect(validateReviewDraft({ ...draft, content: '   ' }, true).content).toBe(
      '내용을 적어 주세요.',
    )
    expect(validateReviewDraft({ ...draft, content: ` ${'가'.repeat(1000)} ` }, true).content).toBe(
      undefined,
    )
    expect(validateReviewDraft({ ...draft, content: '가'.repeat(1001) }, true).content).toBe(
      '내용은 1000자까지 쓸 수 있어요.',
    )
  })

  it('사이즈 없는 상품은 핏을 고를 수 없다 (BE FIT_NOT_APPLICABLE)', () => {
    expect(validateReviewDraft({ ...draft, fit: 'SMALL' }, false).fit).toBeDefined()
    expect(validateReviewDraft({ ...draft, fit: 'SMALL' }, true).fit).toBeUndefined()
    expect(validateReviewDraft({ ...draft, fit: null }, false).fit).toBeUndefined()
  })

  it('사진은 5장까지', () => {
    const urls = (n: number) => Array.from({ length: n }, (_, i) => `https://s3/${i}.jpg`)
    expect(validateReviewDraft({ ...draft, imageUrls: urls(5) }, true).imageUrls).toBeUndefined()
    expect(validateReviewDraft({ ...draft, imageUrls: urls(6) }, true).imageUrls).toBe(
      '사진은 5장까지 올릴 수 있어요.',
    )
  })

  it('빈 초안은 별점 · 내용이 틀리다', () => {
    const errors = validateReviewDraft(EMPTY_REVIEW_DRAFT, true)
    expect(hasDraftErrors(errors)).toBe(true)
    expect(Object.keys(errors).sort()).toEqual(['content', 'rating'])
    expect(hasDraftErrors(validateReviewDraft(draft, true))).toBe(false)
  })
})

describe('canChooseFit', () => {
  it('구매한 사이즈가 있을 때만', () => {
    expect(canChooseFit('120')).toBe(true)
    expect(canChooseFit(null)).toBe(false)
  })
})

describe('fitShares', () => {
  it('핏별 비율(반올림 %)을 작아요 · 잘 맞아요 · 커요 순서로', () => {
    expect(fitShares({ SMALL: 1, TRUE_TO_SIZE: 2, LARGE: 0 })).toEqual([
      { fit: 'SMALL', label: '작아요', count: 1, percent: 33 },
      { fit: 'TRUE_TO_SIZE', label: '잘 맞아요', count: 2, percent: 67 },
      { fit: 'LARGE', label: '커요', count: 0, percent: 0 },
    ])
  })

  it('핏을 남긴 리뷰가 없으면 모두 0%', () => {
    expect(fitShares({ SMALL: 0, TRUE_TO_SIZE: 0, LARGE: 0 }).map((s) => s.percent)).toEqual([
      0, 0, 0,
    ])
  })
})

describe('averageRatingLabel', () => {
  it('소수 첫째 자리, 없으면 -', () => {
    expect(averageRatingLabel(4)).toBe('4.0')
    expect(averageRatingLabel(4.3)).toBe('4.3')
    expect(averageRatingLabel(null)).toBe('-')
  })
})

describe('reviewActionOf', () => {
  const reviewable = new Set(['31'])
  const reviewed = new Set(['32'])

  it('구매확정한 주문상품만 리뷰 버튼을 본다', () => {
    expect(reviewActionOf({ id: '31', status: 'DELIVERED' }, reviewable, reviewed)).toBeNull()
    expect(reviewActionOf({ id: '31', status: 'CONFIRMED' }, reviewable, reviewed)).toBe('write')
  })

  it('이미 썼으면 작성 완료, 자격이 아직 안 왔으면 준비 중 (구매확정 이벤트를 받는 중)', () => {
    expect(reviewActionOf({ id: '32', status: 'CONFIRMED' }, reviewable, reviewed)).toBe('written')
    expect(reviewActionOf({ id: '33', status: 'CONFIRMED' }, reviewable, reviewed)).toBe(
      'preparing',
    )
  })
})

describe('draftOf', () => {
  it('쓴 리뷰로 수정 초안을 만든다', () => {
    const review = {
      rating: 4,
      fit: 'LARGE',
      content: '조금 커요',
      imageUrls: ['https://s3/a.jpg'],
    } as Review
    expect(draftOf(review)).toEqual({
      rating: 4,
      fit: 'LARGE',
      content: '조금 커요',
      imageUrls: ['https://s3/a.jpg'],
    })
  })
})
