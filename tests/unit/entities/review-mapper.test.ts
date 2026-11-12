import { describe, expect, it } from 'vitest'
import {
  toReview,
  toReviewableItem,
  toReviewSummary,
  type MockReviewDto,
  type MockReviewListItemDto,
} from '@/entities/review'

// BE ReviewResponse · ReviewListResponse.Item · ReviewSummaryResponse · EligibleReviewsResponse.Item (community, develop)

const written: MockReviewDto = {
  reviewId: '7',
  orderItemId: '31',
  productId: '1',
  rating: 5,
  content: '잘 맞아요',
  nickname: '보호자',
  authorWithdrawn: false,
  fit: 'TRUE_TO_SIZE',
  purchasedSize: '120',
  imageUrls: [],
  createdAt: '2026-11-09T10:00:00',
  updatedAt: '2026-11-09T10:00:00',
}

describe('toReview', () => {
  it('작성 응답(ReviewResponse)은 상품 정보 · 공개 상태가 없어 null · 공개로 둔다', () => {
    expect(toReview(written)).toEqual({
      id: '7',
      orderItemId: '31',
      productId: '1',
      productName: null,
      thumbnailUrl: null,
      rating: 5,
      content: '잘 맞아요',
      authorName: '보호자',
      fit: 'TRUE_TO_SIZE',
      purchasedSize: '120',
      imageUrls: [],
      isUnderReview: false,
      createdAt: '2026-11-09T10:00:00',
    })
  })

  it('목록 항목은 상품 이름 · 썸네일 · 검토 중 여부를 읽는다', () => {
    const item: MockReviewListItemDto = {
      ...written,
      productName: '테스트-로컬 맨투맨',
      thumbnailUrl: ' https://cdn/x.jpg ',
      displayStatus: 'ON_SALE',
      visibility: 'UNDER_REVIEW',
      updatedAt: '2026-11-09T11:00:00',
    }
    expect(toReview(item)).toMatchObject({
      productName: '테스트-로컬 맨투맨',
      thumbnailUrl: 'https://cdn/x.jpg',
      isUnderReview: true,
    })
  })

  it('작성자 이름: 탈퇴했으면 「탈퇴한 회원」, 몰랐으면 「회원」', () => {
    expect(
      toReview({ ...written, authorWithdrawn: true, nickname: '탈퇴한 회원' }).authorName,
    ).toBe('탈퇴한 회원')
    expect(toReview({ ...written, nickname: null }).authorName).toBe('회원')
  })

  it('모르는 핏 값은 null로 (새 값이 생겨도 화면은 그대로)', () => {
    expect(toReview({ ...written, fit: 'TIGHT' }).fit).toBeNull()
    expect(toReview({ ...written, fit: null }).fit).toBeNull()
  })
})

describe('toReviewSummary', () => {
  it('리뷰 수 · 평균 · 핏 분포', () => {
    expect(
      toReviewSummary({
        productId: '1',
        reviewCount: 3,
        averageRating: 4.3,
        fitSummary: { small: 1, trueToSize: 2, large: 0 },
      }),
    ).toEqual({
      productId: '1',
      count: 3,
      averageRating: 4.3,
      fit: { SMALL: 1, TRUE_TO_SIZE: 2, LARGE: 0 },
    })
  })

  it('리뷰가 없으면 평균은 null', () => {
    expect(
      toReviewSummary({
        productId: '1',
        reviewCount: 0,
        averageRating: null,
        fitSummary: { small: 0, trueToSize: 0, large: 0 },
      }).averageRating,
    ).toBeNull()
  })
})

describe('toReviewableItem', () => {
  it('상품 정보를 아직 못 받았으면 이름 · 썸네일은 null', () => {
    expect(
      toReviewableItem({
        orderItemId: '31',
        orderId: '12',
        productId: '1',
        productName: null,
        thumbnailUrl: '',
        size: null,
        confirmedAt: '2026-11-09T09:00:00',
      }),
    ).toEqual({
      orderItemId: '31',
      orderId: '12',
      productId: '1',
      productName: null,
      thumbnailUrl: null,
      size: null,
      confirmedAt: '2026-11-09T09:00:00',
    })
  })
})
