import { describe, expect, it } from 'vitest'
import { principalOf } from '@/shared/api'

describe('principalOf: 요청에 어느 로그인의 토큰을 붙일지', () => {
  it('관리자 API(/admin/…)는 관리자 토큰 (BE #755: 회원 토큰은 403)', () => {
    expect(principalOf('/admin/members')).toBe('admin')
    expect(principalOf('/admin/settlements/run')).toBe('admin')
  })

  it('자녀 API는 자녀 토큰', () => {
    expect(principalOf('/child/profile')).toBe('child')
    expect(principalOf('/auth/child/login')).toBe('child')
    expect(principalOf('/auth/child/reissue')).toBe('child')
    expect(principalOf('/auth/child-accounts')).toBe('member')
    expect(principalOf('/children/1')).toBe('member')
  })

  it('그 밖의 API는 회원 토큰', () => {
    expect(principalOf('/members/me')).toBe('member')
    expect(principalOf('/seller/orders')).toBe('member')
    expect(principalOf('/settings')).toBe('member')
    expect(principalOf(undefined)).toBe('member')
  })

  it('관리자 로그인 · 재발급 · 로그아웃(/auth/admin/…)은 관리자 API가 아니다 (토큰을 붙이지 않는 요청)', () => {
    expect(principalOf('/auth/admin/login')).toBe('member')
    expect(principalOf('/administrators')).toBe('member')
  })
})
