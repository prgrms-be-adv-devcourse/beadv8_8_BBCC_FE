import { describe, expect, it } from 'vitest'
import { findAdminMember, memberFilterOf, toAdminMember, type AdminMember } from '@/entities/member'

const row = (id: number, isAdmin: boolean): AdminMember =>
  toAdminMember(
    {
      id,
      nickname: `회원${id}`,
      status: 'ACTIVE',
      sellerStatus: null,
      suspendReason: null,
      suspendedAt: null,
      createdAt: '2026-10-01T10:00:00',
    },
    isAdmin,
  )

describe('memberFilterOf: 주소의 ?filter= → 회원 목록 거르기', () => {
  it('아는 값은 그대로', () => {
    expect(memberFilterOf('SELLER')).toBe('SELLER')
    expect(memberFilterOf('ADMIN')).toBe('ADMIN')
  })
  it('없거나 모르는 값은 전체', () => {
    expect(memberFilterOf(null)).toBe('ALL')
    expect(memberFilterOf('')).toBe('ALL')
    expect(memberFilterOf('seller')).toBe('ALL')
  })
})

describe('findAdminMember: 회원 하나 API가 없어 일반 · 관리자 목록에서 찾는다', () => {
  it('일반 목록에만 있으면 일반 회원', () => {
    expect(findAdminMember([row(1, false), row(12, false)], [], '1')).toMatchObject({
      id: '1',
      isAdmin: false,
    })
  })
  it('관리자 목록에 있으면 관리자 (관리자 지정 뒤 일반 목록에서 빠진다)', () => {
    expect(findAdminMember([], [row(3, true)], '3')?.isAdmin).toBe(true)
  })
  it('다시 불러오는 사이 두 목록에 다 있으면 관리자 목록을 따른다', () => {
    expect(findAdminMember([row(1, false)], [row(1, true)], '1')?.isAdmin).toBe(true)
  })
  it('검색어가 다른 회원도 걸러 와도 번호가 같은 회원만', () => {
    expect(findAdminMember([row(11, false)], [row(21, true)], '1')).toBeUndefined()
  })
  it('목록을 아직 못 받았으면 없음', () => {
    expect(findAdminMember(undefined, undefined, '1')).toBeUndefined()
  })
})
