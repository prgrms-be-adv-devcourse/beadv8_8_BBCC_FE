import { describe, expect, it } from 'vitest'
import {
  formatPeriod,
  formatRateLimit,
  periodUnitOf,
  toRateLimitSettings,
} from '@/entities/rate-limit'

describe('요청 수 제한 설정 매퍼 (BE RateLimitSettings.Snapshot)', () => {
  it('켜짐 여부는 그대로, 한도의 기간(ISO-8601)은 밀리초로 바꾼다', () => {
    expect(
      toRateLimitSettings({
        enabled: false,
        client: { capacity: 200, period: 'PT1M' },
        total: { capacity: 500, period: 'PT1S' },
      }),
    ).toEqual({
      isEnabled: false,
      client: { capacity: 200, periodMs: 60_000 },
      total: { capacity: 500, periodMs: 1000 },
    })
  })

  it.each([
    ['PT1H', 3_600_000],
    ['PT1H30M', 5_400_000],
    ['PT48H', 172_800_000],
    ['PT8H6M12.345S', 29_172_345],
    ['PT0.5S', 500],
    ['PT0.001S', 1],
    ['PT1.0005S', 1000],
  ])('기간 %s는 %d밀리초 (Java Duration.toString 형식, 밀리초 아래는 버린다)', (period, ms) => {
    const settings = toRateLimitSettings({
      enabled: true,
      client: { capacity: 1, period },
      total: { capacity: 1, period: 'PT1S' },
    })
    expect(settings.client.periodMs).toBe(ms)
  })

  it.each(['1s', 'PT', 'P1D', ''])('읽을 수 없는 기간 %s는 오류로 알린다', (period) => {
    expect(() =>
      toRateLimitSettings({
        enabled: true,
        client: { capacity: 1, period },
        total: { capacity: 1, period: 'PT1S' },
      }),
    ).toThrow()
  })
})

describe('요청 수 제한 표시', () => {
  it('기간은 나누어떨어지는 가장 큰 단위로 고른다', () => {
    expect(periodUnitOf(3_600_000)).toBe('hour')
    expect(periodUnitOf(90_000)).toBe('second')
    expect(periodUnitOf(60_000)).toBe('minute')
    expect(periodUnitOf(1500)).toBe('millisecond')
  })

  it('기간을 그 단위로 쓴다', () => {
    expect(formatPeriod(1000)).toBe('1초')
    expect(formatPeriod(90_000)).toBe('90초')
    expect(formatPeriod(7_200_000)).toBe('2시간')
    expect(formatPeriod(500)).toBe('500밀리초')
  })

  it('한도는 "기간에 건수"로 쓴다', () => {
    expect(formatRateLimit({ capacity: 200, periodMs: 60_000 })).toBe('1분에 200건')
    expect(formatRateLimit({ capacity: 12_000, periodMs: 1000 })).toBe('1초에 12,000건')
  })
})
