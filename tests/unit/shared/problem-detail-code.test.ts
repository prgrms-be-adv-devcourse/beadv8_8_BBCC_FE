import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it } from 'vitest'
import { isErrorCode } from '@/shared/api'

function problem(data: Record<string, unknown> | null) {
  const config = { headers: new AxiosHeaders() }
  const response = { status: 409, statusText: '', headers: {}, config, data }
  return new AxiosError('error', AxiosError.ERR_BAD_REQUEST, config, null, response)
}

const base = { type: 'about:blank', status: 409, detail: null, instance: '/' }

describe('isErrorCode: 오류를 BE 오류 코드로 나눈다 (#412)', () => {
  it('code가 있으면 code만 본다 (title이 바뀌어도 같은 오류)', () => {
    const error = problem({ ...base, title: '바뀐 문구', code: 'IDEMPOTENCY_KEY_REUSED' })
    expect(isErrorCode(error, 'IDEMPOTENCY_KEY_REUSED', '이미 다른 주문에 쓴 요청입니다')).toBe(
      true,
    )
    expect(isErrorCode(error, 'PRICE_CHANGED')).toBe(false)
  })
  it('code가 있으면 title이 같아도 code가 다르면 다른 오류', () => {
    const error = problem({ ...base, title: '이미 다른 주문에 쓴 요청입니다', code: 'CONFLICT' })
    expect(isErrorCode(error, 'IDEMPOTENCY_KEY_REUSED', '이미 다른 주문에 쓴 요청입니다')).toBe(
      false,
    )
  })
  it('code가 없는 응답(BE #1326 배포 전)은 legacyTitle로 본다', () => {
    const error = problem({ ...base, title: '이미 다른 주문에 쓴 요청입니다' })
    expect(isErrorCode(error, 'IDEMPOTENCY_KEY_REUSED', '이미 다른 주문에 쓴 요청입니다')).toBe(
      true,
    )
    expect(isErrorCode(error, 'IDEMPOTENCY_KEY_REUSED')).toBe(false)
  })
  it('ProblemDetail이 아닌 응답 · axios 밖 오류는 아니다', () => {
    expect(isErrorCode(problem(null), 'IDEMPOTENCY_KEY_REUSED')).toBe(false)
    expect(isErrorCode(new Error('x'), 'IDEMPOTENCY_KEY_REUSED')).toBe(false)
  })
})
