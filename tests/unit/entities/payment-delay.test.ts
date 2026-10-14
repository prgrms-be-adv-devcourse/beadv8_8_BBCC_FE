import { describe, expect, it } from 'vitest'
import { isPaymentDelayed, PAYMENT_DELAY_MS, paymentPollInterval } from '@/entities/order'

describe('결제 처리 지연 (서버 이벤트가 오지 않을 때)', () => {
  it('기준은 30초', () => {
    expect(PAYMENT_DELAY_MS).toBe(30_000)
  })

  it('30초 전까지는 지연 아님, 30초부터 지연 (경계)', () => {
    expect(isPaymentDelayed(0)).toBe(false)
    expect(isPaymentDelayed(29_999)).toBe(false)
    expect(isPaymentDelayed(30_000)).toBe(true)
  })

  it('다시 조회 간격: 30초 전까지 1초, 그 뒤 10초 (경계)', () => {
    expect(paymentPollInterval(0)).toBe(1_000)
    expect(paymentPollInterval(29_999)).toBe(1_000)
    expect(paymentPollInterval(30_000)).toBe(10_000)
    expect(paymentPollInterval(600_000)).toBe(10_000)
  })
})
