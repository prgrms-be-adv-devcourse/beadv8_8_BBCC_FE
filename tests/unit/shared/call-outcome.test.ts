import { describe, expect, it } from 'vitest'
import { expectedReasonOf, isFailedCall } from '@/shared/api'

describe('expectedReasonOf: 요청이 미리 밝힌 예상 응답인지', () => {
  const expected = { statuses: [404], reason: '개발용 토큰은 회원 정보가 없을 수 있음' }

  it('예상한 상태 코드면 이유를 돌려준다', () => {
    expect(expectedReasonOf(404, expected)).toBe('개발용 토큰은 회원 정보가 없을 수 있음')
  })

  it('다른 상태 코드 · 응답 없음 · 예상 없음이면 null', () => {
    expect(expectedReasonOf(500, expected)).toBeNull()
    expect(expectedReasonOf(null, expected)).toBeNull()
    expect(expectedReasonOf(404, undefined)).toBeNull()
  })
})

describe('isFailedCall: 흐름 패널 실패 수에 넣을 호출인지', () => {
  it('4xx · 5xx · 응답 없음은 실패', () => {
    expect(isFailedCall({ status: 409, expectedReason: null })).toBe(true)
    expect(isFailedCall({ status: 500, expectedReason: null })).toBe(true)
    expect(isFailedCall({ status: null, expectedReason: null })).toBe(true)
  })

  it('2xx · 3xx는 실패가 아니다', () => {
    expect(isFailedCall({ status: 200, expectedReason: null })).toBe(false)
    expect(isFailedCall({ status: 302, expectedReason: null })).toBe(false)
  })

  it('예상된 응답은 상태 코드가 4xx여도 실패로 세지 않는다', () => {
    expect(isFailedCall({ status: 401, expectedReason: '재발급 쿠키 없음' })).toBe(false)
  })

  it('예전 기록(필드 없음)은 상태 코드로만 판단한다', () => {
    expect(isFailedCall({ status: 404 })).toBe(true)
  })
})
