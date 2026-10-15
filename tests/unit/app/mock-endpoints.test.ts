import { describe, expect, it } from 'vitest'
import { adminHandlers } from '@/app/mocks/admin-handlers'
import { memberHandlers } from '@/app/mocks/member-handlers'
import { productHandlers } from '@/app/mocks/product-handlers'
import { MOCK_ENDPOINTS } from '@/shared/api'

const handlers = [...productHandlers, ...memberHandlers, ...adminHandlers]
const key = (item: { method: string; path: string }) => `${item.method} ${item.path}`

describe('엔드포인트별 목 ↔ 실제 목록 (mock-endpoints)', () => {
  it('목 핸들러는 모두 목록에 있다 (전환 한 곳에서)', () => {
    const listed = new Set(MOCK_ENDPOINTS.map(key))
    expect(handlers.map(key).filter((item) => !listed.has(item))).toEqual([])
  })
  it('목록에서 목인 엔드포인트는 모두 핸들러가 있다', () => {
    const handled = new Set(handlers.map(key))
    expect(
      MOCK_ENDPOINTS.filter((item) => item.source === 'mock')
        .map(key)
        .filter((item) => !handled.has(item)),
    ).toEqual([])
  })
  it('같은 엔드포인트가 두 번 없다', () => {
    const keys = MOCK_ENDPOINTS.map(key)
    expect(new Set(keys).size).toBe(keys.length)
  })
})
