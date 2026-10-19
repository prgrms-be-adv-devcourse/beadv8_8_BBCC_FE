import { describe, expect, it } from 'vitest'
import { activeMockDomains } from '@/shared/api'

describe('목으로 응답할 도메인 (관리자 설정 목 데이터 × 흐름 패널 도메인 스위치)', () => {
  const enabled = { 상품: true, 주문: false }

  it('목 데이터가 켜져 있으면 도메인 스위치를 그대로 따른다', () => {
    expect(activeMockDomains(enabled, true)).toEqual(enabled)
  })
  it('목 데이터가 꺼져 있으면 모든 도메인을 끈다', () => {
    expect(activeMockDomains(enabled, false)).toEqual({})
  })
})
