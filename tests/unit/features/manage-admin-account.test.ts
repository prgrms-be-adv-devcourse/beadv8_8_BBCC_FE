import { describe, expect, it } from 'vitest'
import {
  ADMIN_PASSWORD_MAX_BYTES,
  ADMIN_PASSWORD_MIN_LENGTH,
  validateAdminPassword,
} from '@/features/manage-admin-account'
import { domainOf } from '@/widgets/api-flow-panel/config/domain-flow'

describe('관리자 비밀번호 규칙 (BE AdminPassword: 12자 이상, UTF-8 72바이트 이하)', () => {
  it('기준은 BE와 같다', () => {
    expect(ADMIN_PASSWORD_MIN_LENGTH).toBe(12)
    expect(ADMIN_PASSWORD_MAX_BYTES).toBe(72)
  })

  it.each([
    ['a'.repeat(11), '비밀번호는 12자 이상 입력해 주세요.'],
    ['', '비밀번호는 12자 이상 입력해 주세요.'],
    ['a'.repeat(12), null],
    ['a'.repeat(72), null],
    ['a'.repeat(73), '비밀번호가 너무 길어요. 영문 기준 72자까지예요.'],
    // 한글은 UTF-8 3바이트: 24자 = 72바이트, 25자 = 75바이트
    ['가'.repeat(24), null],
    ['가'.repeat(25), '비밀번호가 너무 길어요. 영문 기준 72자까지예요.'],
  ])('%j → %j', (password, expected) => {
    expect(validateAdminPassword(password)).toBe(expected)
  })
})

describe('관리자 계정 API 흐름 표시', () => {
  it('관리자 추가 · 비활성화는 회원 도메인이다', () => {
    expect(domainOf('/admin/admins')).toBe('member')
    expect(domainOf('/admin/admins/7/disable')).toBe('member')
  })
})
