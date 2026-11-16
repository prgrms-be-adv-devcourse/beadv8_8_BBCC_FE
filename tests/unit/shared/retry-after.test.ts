import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it } from 'vitest'
import { getRetryAfterSeconds } from '@/shared/api'

function tooMany(headers: Record<string, string>) {
  const config = { headers: new AxiosHeaders() }
  const response = { status: 429, statusText: '', headers, config, data: null }
  return new AxiosError('error', AxiosError.ERR_BAD_REQUEST, config, null, response)
}

describe('getRetryAfterSeconds: 요청 수 제한(429)의 Retry-After(초)', () => {
  it('초 단위 정수를 읽는다', () => {
    expect(getRetryAfterSeconds(tooMany({ 'retry-after': '30' }))).toBe(30)
  })

  it('없거나 숫자가 아니면 null', () => {
    expect(getRetryAfterSeconds(tooMany({}))).toBeNull()
    expect(
      getRetryAfterSeconds(tooMany({ 'retry-after': 'Wed, 21 Oct 2026 07:28:00 GMT' })),
    ).toBeNull()
    expect(getRetryAfterSeconds(new Error('x'))).toBeNull()
  })
})
