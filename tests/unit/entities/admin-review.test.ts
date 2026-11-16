import { describe, expect, it } from 'vitest'
import {
  ADMIN_REVIEW_STATUSES,
  isModerationStatus,
  retryExhaustedMessage,
  MODERATION_REASON_LABEL,
  MODERATION_STATUS_LABEL,
  moderationActionsOf,
  moderationStatusOf,
  toAdminReview,
} from '@/entities/review'

const dto = {
  reviewId: '7',
  productId: '31',
  status: 'HIDDEN',
  reason: 'PROFANITY',
  moderatedAt: '2026-11-12T10:01:00',
  attempts: 0,
  attemptsExhausted: false,
  content: '바보 같은 옷',
  imageUrls: ['https://s3/a.jpg'],
  createdAt: '2026-11-12T10:00:00',
}

describe('toAdminReview: 관리자 리뷰 검사 항목 (BE AdminReviewListResponse.Item)', () => {
  it('상태 · 이유는 아는 값만, 모르는 이유는 기타로', () => {
    expect(toAdminReview(dto)).toEqual({
      id: '7',
      productId: '31',
      status: 'HIDDEN',
      reason: 'PROFANITY',
      moderatedAt: '2026-11-12T10:01:00',
      attempts: 0,
      isAttemptsExhausted: false,
      content: '바보 같은 옷',
      imageUrls: ['https://s3/a.jpg'],
      createdAt: '2026-11-12T10:00:00',
    })
    expect(toAdminReview({ ...dto, reason: 'NEW_KIND' }).reason).toBe('OTHER')
    expect(toAdminReview({ ...dto, reason: null }).reason).toBeNull()
  })

  it('라벨', () => {
    expect(MODERATION_STATUS_LABEL).toEqual({
      HIDDEN: '숨김 (판단 대기)',
      CONFIRMED_HIDDEN: '숨김 확정',
      RESTORED: '다시 공개',
      PENDING: '검사 대기',
      PASSED: '통과',
    })
    expect(MODERATION_REASON_LABEL.PROFANITY).toBe('욕설 · 비속어')
    expect(ADMIN_REVIEW_STATUSES[0]).toBe('HIDDEN')
  })
})

describe('moderationStatusOf: 주소의 ?status=', () => {
  it('아는 값이면 그대로, 없거나 모르면 숨김(판단 대기)', () => {
    expect(moderationStatusOf('RESTORED')).toBe('RESTORED')
    expect(moderationStatusOf(null)).toBe('HIDDEN')
    expect(moderationStatusOf('x')).toBe('HIDDEN')
  })
})

describe('moderationActionsOf: 상태별로 누를 수 있는 조치 (BE는 어느 상태에서든 받지만 결과가 같은 조치는 뺀다)', () => {
  it.each([
    ['HIDDEN', ['HIDDEN', 'VISIBLE']],
    ['CONFIRMED_HIDDEN', ['VISIBLE']],
    ['RESTORED', ['HIDDEN']],
    ['PENDING', ['HIDDEN']],
    ['PASSED', ['HIDDEN']],
  ] as const)('%s → %o', (status, actions) => {
    expect(moderationActionsOf(status)).toEqual(actions)
  })
})

describe('isModerationStatus · 모르는 상태', () => {
  it('아는 다섯 값만 true, 매퍼는 모르는 상태를 검사 대기로', () => {
    expect(isModerationStatus('CONFIRMED_HIDDEN')).toBe(true)
    expect(isModerationStatus('PENDING_EXHAUSTED')).toBe(false)
    expect(isModerationStatus(null)).toBe(false)
    expect(toAdminReview({ ...dto, status: 'NEW_STATUS' }).status).toBe('PENDING')
  })
})

describe('retryExhaustedMessage: 다시 검사 결과 안내 (BE #1310 resetCount)', () => {
  it.each([
    [17, '17건을 다시 검사 대기로 돌렸어요. 1분 안에 다시 검사해요.'],
    [1, '1건을 다시 검사 대기로 돌렸어요. 1분 안에 다시 검사해요.'],
    [0, '다시 검사할 리뷰가 없어요.'],
  ])('%s건 → %s', (count, expected) => {
    expect(retryExhaustedMessage(count)).toBe(expected)
  })
})
