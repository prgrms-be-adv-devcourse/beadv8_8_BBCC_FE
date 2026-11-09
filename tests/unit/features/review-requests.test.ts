import { describe, expect, it } from 'vitest'
import type { Review } from '@/entities/review'
import { toUpdateReviewRequest } from '@/features/edit-review'
import {
  canUploadReviewImageSize,
  canUploadReviewImageType,
  toReviewUploadTargets,
} from '@/features/upload-review-image'
import { toWriteReviewRequest } from '@/features/write-review'

// 계약: BE WriteReviewRequest · UpdateReviewRequest(보낸 키만 바꿈, fit null = 지움, imageUrls 빈 목록 = 모두 지움)
// · ReviewImageUploadRequest(jpeg · png · webp, 1B ~ 10MB)

describe('toWriteReviewRequest', () => {
  it('핏 · 사진이 없으면 키를 빼고, 본문은 앞뒤 공백을 자른다', () => {
    expect(
      toWriteReviewRequest('31', { rating: 5, fit: null, content: '  좋아요 ', imageUrls: [] }),
    ).toEqual({ orderItemId: '31', rating: 5, content: '좋아요' })
  })

  it('핏 · 사진을 고르면 그대로 싣는다', () => {
    expect(
      toWriteReviewRequest('31', {
        rating: 3,
        fit: 'SMALL',
        content: '작아요',
        imageUrls: ['https://s3/a.jpg'],
      }),
    ).toEqual({
      orderItemId: '31',
      rating: 3,
      content: '작아요',
      fit: 'SMALL',
      imageUrls: ['https://s3/a.jpg'],
    })
  })
})

describe('toUpdateReviewRequest', () => {
  const original = {
    rating: 4,
    fit: 'TRUE_TO_SIZE',
    content: '잘 맞아요',
    imageUrls: ['https://s3/a.jpg'],
  } as Review

  it('바뀐 값이 없으면 null (보내지 않는다, BE NO_FIELDS_TO_UPDATE)', () => {
    expect(
      toUpdateReviewRequest(original, {
        rating: 4,
        fit: 'TRUE_TO_SIZE',
        content: ' 잘 맞아요 ',
        imageUrls: ['https://s3/a.jpg'],
      }),
    ).toBeNull()
  })

  it('바뀐 키만 보낸다', () => {
    expect(
      toUpdateReviewRequest(original, {
        rating: 2,
        fit: 'TRUE_TO_SIZE',
        content: '잘 맞아요',
        imageUrls: ['https://s3/a.jpg'],
      }),
    ).toEqual({ rating: 2 })
  })

  it('핏을 지우면 null, 사진을 모두 빼면 빈 목록', () => {
    expect(
      toUpdateReviewRequest(original, {
        rating: 4,
        fit: null,
        content: '잘 맞아요',
        imageUrls: [],
      }),
    ).toEqual({ fit: null, imageUrls: [] })
  })

  it('사진 순서가 바뀌어도 바뀐 것', () => {
    const two = { ...original, imageUrls: ['https://s3/a.jpg', 'https://s3/b.jpg'] }
    expect(
      toUpdateReviewRequest(two, {
        rating: 4,
        fit: 'TRUE_TO_SIZE',
        content: '잘 맞아요',
        imageUrls: ['https://s3/b.jpg', 'https://s3/a.jpg'],
      }),
    ).toEqual({ imageUrls: ['https://s3/b.jpg', 'https://s3/a.jpg'] })
  })
})

describe('리뷰 사진 업로드', () => {
  it('jpeg · png · webp만, 대소문자 그대로', () => {
    expect(canUploadReviewImageType('image/jpeg')).toBe(true)
    expect(canUploadReviewImageType('image/webp')).toBe(true)
    expect(canUploadReviewImageType('image/gif')).toBe(false)
    expect(canUploadReviewImageType('IMAGE/JPEG')).toBe(false)
  })

  it('1바이트 ~ 10MB', () => {
    expect(canUploadReviewImageSize(0)).toBe(false)
    expect(canUploadReviewImageSize(1)).toBe(true)
    expect(canUploadReviewImageSize(10 * 1024 * 1024)).toBe(true)
    expect(canUploadReviewImageSize(10 * 1024 * 1024 + 1)).toBe(false)
  })

  it('만료 시각은 서울 시간으로 읽는다', () => {
    expect(
      toReviewUploadTargets({
        files: [
          {
            uploadUrl: 'https://s3/u?sig',
            imageUrl: 'https://s3/u',
            expiresAt: '2026-11-09T10:05:00',
          },
        ],
      }),
    ).toEqual([
      {
        uploadUrl: 'https://s3/u?sig',
        imageUrl: 'https://s3/u',
        expiresAt: '2026-11-09T10:05:00+09:00',
      },
    ])
  })
})
