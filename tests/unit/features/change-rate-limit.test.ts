import { describe, expect, it } from 'vitest'
import {
  toRateLimit,
  toRateLimitForm,
  toRateLimitRequest,
  validateRateLimitForm,
} from '@/features/change-rate-limit'

describe('한도 입력 칸', () => {
  it('지금 한도를 나누어떨어지는 가장 큰 단위로 채운다', () => {
    expect(toRateLimitForm({ capacity: 200, periodMs: 60_000 })).toEqual({
      capacity: '200',
      periodAmount: '1',
      periodUnit: 'minute',
    })
    expect(toRateLimitForm({ capacity: 5, periodMs: 1500 })).toEqual({
      capacity: '5',
      periodAmount: '1500',
      periodUnit: 'millisecond',
    })
  })

  it('입력을 한도로 바꾼다', () => {
    expect(toRateLimit({ capacity: '800', periodAmount: '2', periodUnit: 'second' })).toEqual({
      capacity: 800,
      periodMs: 2000,
    })
  })
})

describe('한도 입력 검사 (BE RateLimitSettingsGatewayFilterFactory.Limit)', () => {
  const form = (capacity: string, periodAmount = '1') =>
    ({ capacity, periodAmount, periodUnit: 'second' }) as const

  it('건수는 1 이상 Integer 최댓값 이하의 정수', () => {
    expect(validateRateLimitForm(form('1'))).toBeNull()
    expect(validateRateLimitForm(form('2147483647'))).toBeNull()
    expect(validateRateLimitForm(form('0'))).toBe('건수는 1 이상의 정수로 입력해 주세요.')
    expect(validateRateLimitForm(form('1.5'))).toBe('건수는 1 이상의 정수로 입력해 주세요.')
    expect(validateRateLimitForm(form(''))).toBe('건수는 1 이상의 정수로 입력해 주세요.')
    expect(validateRateLimitForm(form('2147483648'))).toBe(
      '건수는 2,147,483,647건까지 입력할 수 있어요.',
    )
  })

  it('기간은 1 이상의 정수 (가장 작은 단위가 밀리초라 1ms 미만은 없다)', () => {
    expect(validateRateLimitForm(form('1', '1'))).toBeNull()
    expect(validateRateLimitForm(form('1', '0'))).toBe('기간은 1 이상의 정수로 입력해 주세요.')
    expect(validateRateLimitForm(form('1', '-1'))).toBe('기간은 1 이상의 정수로 입력해 주세요.')
  })

  it('밀리초로 바꿔 정확히 셀 수 없을 만큼 긴 기간은 막는다', () => {
    const tooLong = { capacity: '1', periodAmount: '9007199254741', periodUnit: 'hour' } as const
    expect(validateRateLimitForm(tooLong)).toBe('기간이 너무 길어요.')
  })
})

describe('요청 수 제한 변경 요청 (BE PUT /admin/gateway/rate-limit)', () => {
  it('바꿀 칸만 보낸다', () => {
    expect(toRateLimitRequest({ isEnabled: false })).toEqual({ enabled: false })
    const limit = { capacity: 800, periodMs: 1000 }
    expect(toRateLimitRequest({ target: 'total', limit })).toEqual({
      total: { capacity: 800, period: 'PT1S' },
    })
    expect(toRateLimitRequest({ target: 'client', limit })).toEqual({
      client: { capacity: 800, period: 'PT1S' },
    })
  })

  it('기간은 초 단위 ISO-8601로 보낸다 (밀리초는 소수)', () => {
    const periodOf = (periodMs: number) =>
      toRateLimitRequest({ target: 'client', limit: { capacity: 1, periodMs } }).client?.period
    expect(periodOf(60_000)).toBe('PT60S')
    expect(periodOf(1500)).toBe('PT1.5S')
    expect(periodOf(1)).toBe('PT0.001S')
  })
})
