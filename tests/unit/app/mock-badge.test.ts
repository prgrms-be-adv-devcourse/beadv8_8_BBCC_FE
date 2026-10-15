import { describe, expect, it } from 'vitest'
import { isMockActive, registerMockHandlers } from '@/shared/api'

describe('목 배지 출처 isMockActive (mock-endpoints · 도메인 켜짐)', () => {
  registerMockHandlers('배지 테스트', [
    { method: 'GET', path: '/admin/orders', handle: () => ({ status: 200 }) },
    // 목록에 없는 경로는 등록하지 않는다
    { method: 'GET', path: '/없는-경로', handle: () => ({ status: 200 }) },
  ])
  it('목록에서 목이고 도메인이 켜져 있으면 true', () => {
    expect(isMockActive('GET', '/admin/orders', { '배지 테스트': true })).toBe(true)
  })
  it('도메인을 끄면 false (흐름 패널)', () => {
    expect(isMockActive('GET', '/admin/orders', { '배지 테스트': false })).toBe(false)
  })
  it('목록에 없거나 메서드가 다르면 false', () => {
    expect(isMockActive('GET', '/없는-경로', { '배지 테스트': true })).toBe(false)
    expect(isMockActive('POST', '/admin/orders', { '배지 테스트': true })).toBe(false)
  })
})
