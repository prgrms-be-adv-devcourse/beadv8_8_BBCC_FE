import { describe, expect, it } from 'vitest'
import { expectedPayoutLabel, toSettlement, toSettlementTarget } from '@/entities/settlement'

const settlementDto = {
  settlementId: 1,
  periodStartOn: '2026-11-01',
  periodEndOn: '2026-11-11',
  totalSalesAmount: 100000,
  feeRate: 0.1,
  feeAmount: 10000,
  settlementAmount: 90000,
  status: 'PAID',
  completedAt: null,
  paidAt: null,
}

describe('정산 예정일 표시', () => {
  it('예정일이 있으면 날짜를 그대로', () => {
    expect(expectedPayoutLabel('2026-11-13')).toBe('2026-11-13')
  })
  it('공휴일 정보를 못 받아 null이면 "예정일 확인 중"', () => {
    expect(expectedPayoutLabel(null)).toBe('예정일 확인 중')
  })
})

describe('정산 대상 매퍼', () => {
  it('예정일을 그대로 옮긴다 (null 포함)', () => {
    const dto = {
      orderItemId: 2,
      orderId: 1,
      salesAmount: 25000,
      confirmedAt: '2026-11-12T09:00:00',
    }
    expect(toSettlementTarget({ ...dto, expectedPayoutOn: '2026-11-13' })).toEqual({
      orderItemId: '2',
      orderId: '1',
      amount: 25000,
      confirmedAt: '2026-11-12T09:00:00',
      expectedPayoutOn: '2026-11-13',
    })
    expect(toSettlementTarget({ ...dto, expectedPayoutOn: null }).expectedPayoutOn).toBeNull()
  })
})

describe('수수료율 (BE는 0~1 소수, 소수점 넷째 자리까지)', () => {
  it('0.1 → 10%', () => {
    expect(toSettlement(settlementDto).feeRatePercent).toBe(10)
  })
  it('0.035 → 3.5% (반올림으로 잃지 않는다)', () => {
    expect(toSettlement({ ...settlementDto, feeRate: 0.035 }).feeRatePercent).toBe(3.5)
  })
  it('0.0125 → 1.25%', () => {
    expect(toSettlement({ ...settlementDto, feeRate: 0.0125 }).feeRatePercent).toBe(1.25)
  })
})
