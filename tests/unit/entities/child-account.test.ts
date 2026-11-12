import { describe, expect, it } from 'vitest'
import { accountOfChild, isValidChildLoginId, isValidChildPassword } from '@/entities/child-account'
import { toChildAccountRequest } from '@/features/manage-child-account/model/child-account.mapper'
import { toChildAccount } from '@/entities/child-account/model/child-account.mapper'

describe('자녀 계정', () => {
  it('서버 ID를 문자열로 변환한다', () => {
    expect(toChildAccount({ id: 1, childProfileId: 2, loginId: 'child1' })).toEqual({
      id: '1',
      childId: '2',
      loginId: 'child1',
    })
  })
  it('생성 요청의 자녀 ID를 숫자로 변환한다', () => {
    expect(toChildAccountRequest('2', 'child1', 'password1')).toEqual({
      childProfileId: 2,
      loginId: 'child1',
      password: 'password1',
    })
  })
  it('아이디와 비밀번호 경계를 검사한다', () => {
    for (const id of ['abc', 'a'.repeat(21), 'ABCD', 'abc-'])
      expect(isValidChildLoginId(id)).toBe(false)
    for (const id of ['abcd', 'a'.repeat(20), 'abc1']) expect(isValidChildLoginId(id)).toBe(true)
    expect(isValidChildPassword('1234567')).toBe(false)
    expect(isValidChildPassword('12345678')).toBe(true)
  })
  it('비밀번호는 BE ChildPassword처럼 8자 이상 · UTF-8 72바이트 이하', () => {
    expect(isValidChildPassword('a'.repeat(72))).toBe(true)
    expect(isValidChildPassword('a'.repeat(73))).toBe(false)
    // 한글은 3바이트: 24자 = 72바이트, 25자 = 75바이트
    expect(isValidChildPassword('가'.repeat(24))).toBe(true)
    expect(isValidChildPassword('가'.repeat(25))).toBe(false)
    // 한글 섞기: 23자(69바이트) + 영문 3자 = 72바이트, 4자 = 73바이트
    expect(isValidChildPassword('가'.repeat(23) + 'abc')).toBe(true)
    expect(isValidChildPassword('가'.repeat(23) + 'abcd')).toBe(false)
    // 8자 하한은 바이트가 아니라 글자 수
    expect(isValidChildPassword('가'.repeat(7))).toBe(false)
    expect(isValidChildPassword('가'.repeat(8))).toBe(true)
  })
  it('비밀번호가 공백뿐이면 막는다 (BE @NotBlank)', () => {
    expect(isValidChildPassword(' '.repeat(8))).toBe(false)
  })
  it('프로필에 연결된 계정만 찾는다', () => {
    const accounts = [{ id: '1', childId: '2', loginId: 'child1' }]
    expect(accountOfChild(accounts, '2')).toEqual(accounts[0])
    expect(accountOfChild(accounts, '3')).toBeUndefined()
  })
})
