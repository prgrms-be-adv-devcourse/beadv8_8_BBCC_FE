import type { AxiosRequestConfig } from 'axios'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { recommendationApi } from '@/entities/recommendation'
import { apiClient } from '@/shared/api'

function spyGet(data: unknown) {
  return vi
    .spyOn(apiClient, 'get')
    .mockResolvedValue({ data, status: 200, statusText: '', headers: {}, config: {} })
}

function requestOf(spy: ReturnType<typeof spyGet>): [string, unknown] {
  const [url, config] = spy.mock.calls[0] as [string, AxiosRequestConfig | undefined]
  return [url, config?.params]
}

// BE가 자녀 서비스 분리를 위해 추천 주소를 /recommendations 아래로 옮겼다. ID는 쿼리로 보낸다
describe('추천 요청 주소 (/recommendations 아래, ID는 쿼리)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('사이즈 추천은 productId · childId를 쿼리로 보낸다', async () => {
    const spy = spyGet({})

    await recommendationApi.getSize('7', '501')

    expect(requestOf(spy)).toEqual(['/recommendations/size', { productId: '7', childId: '501' }])
  })

  it('맞춤 목록은 childId를 쿼리로 함께 보낸다', async () => {
    const spy = spyGet({ content: [] })

    await recommendationApi.getProducts('501', { categoryId: '11', page: 0, size: 20 })

    expect(requestOf(spy)).toEqual([
      '/recommendations/products',
      { childId: '501', categoryId: '11', page: 0, size: 20 },
    ])
  })
})
