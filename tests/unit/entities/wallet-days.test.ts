import { describe, expect, it } from 'vitest'
import { transactionsByDay, type WalletTransaction } from '@/entities/wallet'

const tx = (id: string, createdAt: string): WalletTransaction => ({
  id,
  type: 'CHARGE',
  amount: 1000,
  balanceAfter: 1000,
  refId: null,
  createdAt,
  deposit: true,
})

describe('예치금 이용 내역을 날짜별로 묶는다 (최신 날짜 · 최신 거래가 위)', () => {
  it('같은 날은 한 묶음, 날짜 이름은 「10월 20일 화요일」', () => {
    const days = transactionsByDay([
      tx('1', '2026-10-19T09:00:00'),
      tx('3', '2026-10-20T18:30:00'),
      tx('2', '2026-10-20T08:00:00'),
    ])
    expect(days.map((day) => [day.date, day.label, day.items.map((item) => item.id)])).toEqual([
      ['2026-10-20', '10월 20일 화요일', ['3', '2']],
      ['2026-10-19', '10월 19일 월요일', ['1']],
    ])
  })

  it('거래가 없으면 빈 목록', () => {
    expect(transactionsByDay([])).toEqual([])
  })
})
