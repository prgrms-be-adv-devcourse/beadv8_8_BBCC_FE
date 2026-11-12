import { describe, expect, it } from 'vitest'
import { toWishRequest, wishDeadlineLabel, type MockWishRequestDto } from '@/entities/wish'

// 서버 시각은 시간대 없는 KST 문자열(yyyy-MM-ddTHH:mm:ss). 화면도 같은 방식으로 읽는다
const NOW = new Date('2026-11-12T10:00:00')
const pending = (expiresAt: string | null) => ({
  status: 'REQUESTED' as const,
  expiresAt,
  expiredAt: null,
})

describe('wishDeadlineLabel: 조르기 남은 기한', () => {
  it('7일 남음 (보낸 직후, 기본 기한 7일)', () => {
    expect(wishDeadlineLabel(pending('2026-11-19T10:00:00'), NOW)).toBe('7일 남음')
  })
  it('정확히 1일 남으면 1일 남음', () => {
    expect(wishDeadlineLabel(pending('2026-11-13T10:00:00'), NOW)).toBe('1일 남음')
  })
  it('1일보다 1초 적으면 오늘 마감', () => {
    expect(wishDeadlineLabel(pending('2026-11-13T09:59:59'), NOW)).toBe('오늘 마감')
  })
  it('1초 남으면 오늘 마감', () => {
    expect(wishDeadlineLabel(pending('2026-11-12T10:00:01'), NOW)).toBe('오늘 마감')
  })
  it('기한 시각이 되면 기한 지남 (만료 처리 전 대기)', () => {
    expect(wishDeadlineLabel(pending('2026-11-12T10:00:00'), NOW)).toBe('기한 지남')
    expect(wishDeadlineLabel(pending('2026-11-11T10:00:00'), NOW)).toBe('기한 지남')
  })
  it('대기인데 기한이 없으면(만료 꺼짐) 표시 없음', () => {
    expect(wishDeadlineLabel(pending(null), NOW)).toBeNull()
  })
  it('만료면 만료된 시각 (상태 라벨 「기한 지나 만료」와 함께 보이므로 시각만)', () => {
    expect(
      wishDeadlineLabel(
        { status: 'EXPIRED', expiresAt: null, expiredAt: '2026-11-19T10:15:00' },
        NOW,
      ),
    ).toBe('2026-11-19 10:15 만료')
  })
  it('결제 · 거절 · 철회는 표시 없음', () => {
    for (const status of ['PAID', 'REJECTED', 'CANCELLED'] as const)
      expect(wishDeadlineLabel({ status, expiresAt: null, expiredAt: null }, NOW)).toBeNull()
  })
})

describe('조르기 매퍼: 기한 칸을 버리지 않는다', () => {
  it('expiresAt · expiredAt', () => {
    const dto = {
      requestId: '1',
      type: 'PURCHASE',
      childId: '3',
      status: 'REQUESTED',
      requestedByType: 'CHILD',
      requestedById: '9',
      message: null,
      requestedAt: '2026-11-12T10:00:00',
      payerType: null,
      payerId: null,
      paidAt: null,
      rejectReason: null,
      rejectedAt: null,
      cancelReason: null,
      cancelledAt: null,
      expiresAt: '2026-11-19T10:00:00',
      expiredAt: null,
      items: [],
      purchases: [],
      paidOrderItemIds: [],
    } satisfies MockWishRequestDto
    const wish = toWishRequest(dto)
    expect(wish.expiresAt).toBe('2026-11-19T10:00:00')
    expect(wish.expiredAt).toBeNull()
  })
})
