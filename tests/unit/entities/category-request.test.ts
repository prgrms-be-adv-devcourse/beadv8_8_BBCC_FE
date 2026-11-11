import type { AxiosRequestConfig } from 'axios'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { productApi } from '@/entities/product'
import { apiClient } from '@/shared/api'

// 카테고리 목록은 고른 자녀의 성별을 붙여 부른다 (BE #1219: MALE이면 여아 전용 카테고리를 뺀다)
describe('카테고리 목록 요청', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it.each([
    ['MALE', { gender: 'MALE' }],
    ['FEMALE', { gender: 'FEMALE' }],
    [null, undefined],
  ] as const)('성별 %s → 쿼리 %j', async (gender, params) => {
    const spy = vi
      .spyOn(apiClient, 'get')
      .mockResolvedValue({ data: [], status: 200, statusText: '', headers: {}, config: {} })

    await productApi.categories(gender)

    const [url, config] = spy.mock.calls[0] as [string, AxiosRequestConfig | undefined]
    expect([url, config?.params]).toEqual(['/categories', params])
  })
})
