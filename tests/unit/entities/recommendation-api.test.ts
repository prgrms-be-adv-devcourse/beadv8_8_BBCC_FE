import type { AxiosRequestConfig } from 'axios'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { recommendationApi, SELF_TARGET } from '@/entities/recommendation'
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

  it('함께 사면 좋은 상품은 productId · childId를 쿼리로 보낸다 (SSE)', async () => {
    const spy = spyGet(new ReadableStream({ start: (controller) => controller.close() }))

    await recommendationApi.streamCompanions('7', '501')

    expect(requestOf(spy)).toEqual([
      '/recommendations/companions',
      { productId: '7', childId: '501' },
    ])
  })

  it('맞춤 목록은 childId를 쿼리로 함께 보낸다', async () => {
    const spy = spyGet({ content: [] })

    await recommendationApi.getProducts('501', { categoryId: '11', page: 0, size: 20 })

    expect(requestOf(spy)).toEqual([
      '/recommendations/products',
      { childId: '501', categoryId: '11', page: 0, size: 20 },
    ])
  })

  it('2쪽부터는 1쪽 응답의 기준 시각 asOf를 쿼리로 함께 보낸다', async () => {
    const spy = spyGet({ content: [] })

    await recommendationApi.getProducts('501', { page: 1, size: 20, asOf: '2026-11-11T10:20:30' })

    expect(requestOf(spy)).toEqual([
      '/recommendations/products',
      { childId: '501', page: 1, size: 20, asOf: '2026-11-11T10:20:30' },
    ])
  })
})

// BE #1639: 자녀 본인 추천은 자녀 토큰으로, childId 없이 (서버가 계정의 자녀로 정한다)
describe('누구의 추천인지에 따라 토큰 주체 · childId가 다르다', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })
  const emptyStream = () => new ReadableStream({ start: (controller) => controller.close() })
  const principalOf = (spy: ReturnType<typeof spyGet>) =>
    (spy.mock.calls[0][1] as { principal?: string } | undefined)?.principal

  it('보호자가 고른 자녀: 회원 토큰(주체 지정 없음) + childId', async () => {
    const spy = spyGet(emptyStream())
    await recommendationApi.streamSize('7', { kind: 'guardian', childId: '501' })
    expect(requestOf(spy)).toEqual(['/recommendations/size', { productId: '7', childId: '501' }])
    expect(principalOf(spy)).toBeUndefined()
  })

  it('자녀 본인 사이즈 추천: 자녀 토큰 + productId만', async () => {
    const spy = spyGet(emptyStream())
    await recommendationApi.streamSize('7', SELF_TARGET)
    expect(requestOf(spy)).toEqual(['/recommendations/size', { productId: '7' }])
    expect(principalOf(spy)).toBe('child')
  })

  it('자녀 본인 홈 맛보기: 자녀 토큰 + 쿼리 없음', async () => {
    const spy = spyGet(emptyStream())
    await recommendationApi.streamPreview(SELF_TARGET)
    expect(requestOf(spy)).toEqual(['/recommendations/products/preview', {}])
    expect(principalOf(spy)).toBe('child')
  })
})
