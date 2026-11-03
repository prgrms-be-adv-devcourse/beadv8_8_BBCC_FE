import { describe, expect, it } from 'vitest'
import { findAdminMember, memberFilterOf, toAdminMember, type AdminMember } from '@/entities/member'

const row = (id: number): AdminMember =>
  toAdminMember({
    id,
    nickname: `회원${id}`,
    status: 'ACTIVE',
    sellerStatus: null,
    suspendReason: null,
    suspendedAt: null,
    createdAt: '2026-10-01T10:00:00',
  })

describe('memberFilterOf: 주소의 ?filter= → 회원 목록 거르기', () => {
  it('아는 값은 그대로', () => {
    expect(memberFilterOf('SELLER')).toBe('SELLER')
  })
  it('없거나 모르는 값은 전체', () => {
    expect(memberFilterOf(null)).toBe('ALL')
    expect(memberFilterOf('')).toBe('ALL')
    expect(memberFilterOf('seller')).toBe('ALL')
  })
  it('관리자 탭은 없어졌다 (BE #762부터 filter=ADMIN은 400). 예전 주소는 전체로', () => {
    expect(memberFilterOf('ADMIN')).toBe('ALL')
  })
})

describe('findAdminMember: 회원 하나 API가 없어 전체 목록에서 번호로 찾는다', () => {
  it('번호가 같은 회원', () => {
    expect(findAdminMember([row(1), row(12)], '1')).toMatchObject({ id: '1' })
  })
  it('검색어가 다른 회원도 걸러 와도 번호가 같은 회원만', () => {
    expect(findAdminMember([row(11), row(21)], '1')).toBeUndefined()
  })
  it('목록을 아직 못 받았으면 없음', () => {
    expect(findAdminMember(undefined, '1')).toBeUndefined()
  })
})
