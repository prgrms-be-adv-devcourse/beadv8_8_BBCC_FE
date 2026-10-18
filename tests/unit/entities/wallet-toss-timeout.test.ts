import type { AxiosRequestConfig } from 'axios'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { walletApi } from '@/entities/wallet'
import { apiClient } from '@/shared/api'

// BE가 토스 응답을 기다리는 최대 시간: 연결 3초(toss.connect-timeout) + 응답 30초(toss.read-timeout)
const BE_TOSS_MAX_WAIT_MS = 33_000
const DEFAULT_TIMEOUT_MS = 10_000

function spyPost(data: unknown) {
  return vi
    .spyOn(apiClient, 'post')
    .mockResolvedValue({ data, status: 200, statusText: '', headers: {}, config: {} })
}

function timeoutOf(spy: ReturnType<typeof spyPost>): number | undefined {
  const config = spy.mock.calls[0]?.[2] as AxiosRequestConfig | undefined
  return config?.timeout
}

describe('토스를 부르는 요청의 시간 제한 (BE보다 오래 기다려 202 확인 중을 받는다)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('기본 시간 제한은 10초 그대로', () => {
    expect(apiClient.defaults.timeout).toBe(DEFAULT_TIMEOUT_MS)
  })

  it('충전 승인은 BE 최대 대기보다 길게 기다린다', async () => {
    const spy = spyPost({ chargeId: 1, status: 'DONE', amount: 10000, balance: 10000 })

    await walletApi.confirmCharge({ paymentKey: 'key', orderId: 'order', amount: 10000 })

    expect(timeoutOf(spy)).toBeGreaterThan(BE_TOSS_MAX_WAIT_MS)
  })

  it('충전 취소는 BE 최대 대기보다 길게 기다린다', async () => {
    const spy = spyPost({ chargeId: 1, status: 'CANCELLED', amount: 10000, balance: 0 })

    await walletApi.cancelCharge('1')

    expect(timeoutOf(spy)).toBeGreaterThan(BE_TOSS_MAX_WAIT_MS)
  })
})
