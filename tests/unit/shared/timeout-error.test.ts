import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it } from 'vitest'
import { getErrorMessage, isSessionRejected, isTimeoutError } from '@/shared/api'

function axiosError(code: string, status?: number) {
  const config = { headers: new AxiosHeaders() }
  const response =
    status === undefined ? undefined : { status, statusText: '', headers: {}, config, data: null }
  return new AxiosError('error', code, config, null, response)
}

describe('isTimeoutError: 응답을 기다리다 시간 제한을 넘겼는지', () => {
  it('axios 시간 초과(ECONNABORTED · ETIMEDOUT)는 true', () => {
    expect(isTimeoutError(axiosError(AxiosError.ECONNABORTED))).toBe(true)
    expect(isTimeoutError(axiosError(AxiosError.ETIMEDOUT))).toBe(true)
  })

  it('서버가 응답한 오류 · 연결 실패 · axios 밖 오류는 false', () => {
    expect(isTimeoutError(axiosError(AxiosError.ERR_BAD_RESPONSE, 500))).toBe(false)
    expect(isTimeoutError(axiosError(AxiosError.ERR_NETWORK))).toBe(false)
    expect(isTimeoutError(new Error('timeout'))).toBe(false)
  })

  it('연결 실패는 고객이 할 일만 안내한다 (서버 상태 확인은 개발자용이라 쓰지 않는다)', () => {
    expect(getErrorMessage(axiosError(AxiosError.ERR_NETWORK))).toBe(
      '잠시 연결이 원활하지 않아요. 잠시 뒤 다시 시도해 주세요.',
    )
  })

  it('시간 초과 문구는 그대로 다시 시도를 안내한다', () => {
    expect(getErrorMessage(axiosError(AxiosError.ETIMEDOUT))).toBe(
      '응답이 늦어 요청을 끝내지 못했어요. 다시 시도해 주세요.',
    )
  })
})

describe('getErrorMessage: 서버에 없는 경로', () => {
  function notFound(detail: string) {
    const config = { headers: new AxiosHeaders() }
    const data = { type: 'about:blank', title: 'Not Found', status: 404, detail, instance: '/x' }
    const response = { status: 404, statusText: '', headers: {}, config, data }
    return new AxiosError('error', AxiosError.ERR_BAD_REQUEST, config, null, response)
  }
  it('스프링 기본 404(No static resource)는 원문 대신 안내 문구를 보여 준다', () => {
    expect(getErrorMessage(notFound('No static resource api/v1/child/wish.'))).toBe(
      '요청한 기능을 서버에서 찾을 수 없어요. (404)',
    )
  })
  it('업무 404는 detail을 그대로 보여 준다', () => {
    expect(getErrorMessage(notFound('없는 조르기입니다. 목록을 새로고침해 주세요.'))).toBe(
      '없는 조르기입니다. 목록을 새로고침해 주세요.',
    )
  })
})

describe('isSessionRejected: 재발급 실패 가운데 로그인을 정리해야 하는 것만 true', () => {
  it('서버가 토큰을 거절한 401 · 403은 로그인을 정리한다', () => {
    expect(isSessionRejected(axiosError(AxiosError.ERR_BAD_REQUEST, 401))).toBe(true)
    expect(isSessionRejected(axiosError(AxiosError.ERR_BAD_REQUEST, 403))).toBe(true)
  })

  it('배포 중 503 · 연결 실패 · 시간 초과는 로그인을 지우지 않는다 (서버가 돌아오면 그대로 이어진다)', () => {
    expect(isSessionRejected(axiosError(AxiosError.ERR_BAD_RESPONSE, 503))).toBe(false)
    expect(isSessionRejected(axiosError(AxiosError.ERR_BAD_RESPONSE, 502))).toBe(false)
    expect(isSessionRejected(axiosError(AxiosError.ERR_NETWORK))).toBe(false)
    expect(isSessionRejected(axiosError(AxiosError.ETIMEDOUT))).toBe(false)
  })

  it('axios 밖 오류(쿠키 없음 등)는 로그인 정보가 없는 것이라 정리한다', () => {
    expect(isSessionRejected(new Error('no refresh token'))).toBe(true)
  })
})
