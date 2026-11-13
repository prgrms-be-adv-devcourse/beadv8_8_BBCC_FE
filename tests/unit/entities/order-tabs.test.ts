import { describe, expect, it } from 'vitest'
import { ORDER_TABS, orderStatusOfTab } from '@/entities/order'

describe('주문 내역 상태 탭', () => {
  it('탭 순서: 전체 · 결제 처리 중 · 결제 완료 · 취소', () => {
    expect(ORDER_TABS.map((tab) => tab.label)).toEqual([
      '전체',
      '결제 처리 중',
      '결제 완료',
      '취소',
    ])
  })

  // BE #1280: 목록 API의 status는 응답 status와 같은 대문자 값 하나. 전체는 status를 빼고 보낸다
  it('탭 → 목록 API status (전체는 null = 보내지 않음)', () => {
    expect(orderStatusOfTab('ALL')).toBeNull()
    expect(orderStatusOfTab('PENDING_PAYMENT')).toBe('PENDING_PAYMENT')
    expect(orderStatusOfTab('PAID')).toBe('PAID')
    expect(orderStatusOfTab('CANCELLED')).toBe('CANCELLED')
  })
})
