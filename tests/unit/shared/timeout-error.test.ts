import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it } from 'vitest'
import { getErrorMessage, isTimeoutError } from '@/shared/api'

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

  it('시간 초과 문구는 그대로 다시 시도를 안내한다', () => {
    expect(getErrorMessage(axiosError(AxiosError.ETIMEDOUT))).toBe(
      '응답이 늦어 요청을 끝내지 못했어요. 다시 시도해 주세요.',
    )
  })
})
