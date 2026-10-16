import { describe, expect, it } from 'vitest'
import { summarizeOrdersOn } from '@/entities/order'
import { compareValues, kstDateString, toCsv } from '@/shared/lib'

describe('toCsv', () => {
  it('머리글 + 줄, 쉼표 · 따옴표 · 줄바꿈은 감싼다', () => {
    const csv = toCsv(
      [
        { id: '1', name: '데일리, 맨투맨', memo: '말 "큰" 사이즈' },
        { id: '2', name: '조거', memo: null },
      ],
      [
        { header: '번호', value: (row) => row.id },
        { header: '이름', value: (row) => row.name },
        { header: '메모', value: (row) => row.memo },
      ],
    )
    expect(csv).toBe('번호,이름,메모\r\n1,"데일리, 맨투맨","말 ""큰"" 사이즈"\r\n2,조거,')
  })
})

describe('compareValues', () => {
  it('숫자는 크기, 글자는 숫자 섞여도 자연 순서, null은 뒤', () => {
    expect([10, 2, 33].sort(compareValues)).toEqual([2, 10, 33])
    expect(['주문 10', '주문 9'].sort(compareValues)).toEqual(['주문 9', '주문 10'])
    expect([null, 1].sort(compareValues)).toEqual([1, null])
  })
})

describe('kstDateString: 한국 날짜 (UTC 15시 = 다음 날 0시)', () => {
  it('경계', () => {
    expect(kstDateString(new Date('2026-10-16T14:59:59Z'))).toBe('2026-10-16')
    expect(kstDateString(new Date('2026-10-16T15:00:00Z'))).toBe('2026-10-17')
  })
})

describe('summarizeOrdersOn: 관리자 대시보드 오늘 주문', () => {
  it('그날 주문 수 · 결제된 금액 · 취소', () => {
    const orders = [
      { status: 'PAID' as const, orderedAt: '2026-10-16T09:00:00', totalAmount: 25000 },
      { status: 'CANCELLED' as const, orderedAt: '2026-10-16T10:00:00', totalAmount: 30000 },
      { status: 'PENDING_PAYMENT' as const, orderedAt: '2026-10-16T11:00:00', totalAmount: 1000 },
      { status: 'PAID' as const, orderedAt: '2026-10-15T23:59:59', totalAmount: 99000 },
    ]
    expect(summarizeOrdersOn(orders, '2026-10-16')).toEqual({
      count: 3,
      paidAmount: 25000,
      cancelled: 1,
    })
  })
})
