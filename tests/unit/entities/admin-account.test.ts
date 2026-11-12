import { describe, expect, it } from 'vitest'
import {
  ADMIN_STATUS_LABEL,
  canDisableAdmin,
  isSignedInAdmin,
  toAdminAccount,
  type AdminAccount,
} from '@/entities/admin-account'

describe('관리자 계정 매퍼 (BE AdminResponse)', () => {
  it('ID는 문자열로 바꾸고 이메일 · 상태 · 만든 시각은 그대로 둔다', () => {
    expect(
      toAdminAccount({
        id: 7,
        email: 'new@kidly.test',
        status: 'DISABLED',
        createdAt: '2026-11-12T10:00:00',
      }),
    ).toEqual({
      id: '7',
      email: 'new@kidly.test',
      status: 'DISABLED',
      createdAt: '2026-11-12T10:00:00',
    })
  })

  it('상태 라벨은 BE AdminStatus 두 가지', () => {
    expect(ADMIN_STATUS_LABEL).toEqual({ ACTIVE: '활성', DISABLED: '비활성' })
  })
})

describe('관리자 비활성화 가능 여부 (BE AdminAccount.disable)', () => {
  const admin = (id: string, status: AdminAccount['status']): AdminAccount => ({
    id,
    email: `admin${id}@kidly.test`,
    status,
    createdAt: '2026-11-12T10:00:00',
  })

  it('활성인 다른 관리자는 비활성화할 수 있다', () => {
    expect(canDisableAdmin(admin('7', 'ACTIVE'), '1')).toBe(true)
  })

  it('이미 비활성인 관리자는 다시 비활성화하지 않는다 (BE는 204로 아무 일 없음)', () => {
    expect(canDisableAdmin(admin('7', 'DISABLED'), '1')).toBe(false)
  })

  it('지금 로그인한 관리자 자신은 막는다 (BE 409 ADMIN_NOT_DISABLABLE)', () => {
    expect(isSignedInAdmin(admin('1', 'ACTIVE'), '1')).toBe(true)
    expect(canDisableAdmin(admin('1', 'ACTIVE'), '1')).toBe(false)
  })

  it('내 관리자 ID를 모르면 막지 않고 서버 안내에 맡긴다', () => {
    expect(isSignedInAdmin(admin('1', 'ACTIVE'), null)).toBe(false)
    expect(canDisableAdmin(admin('1', 'ACTIVE'), null)).toBe(true)
  })
})
