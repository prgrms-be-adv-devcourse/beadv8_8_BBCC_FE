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
  it('프로필에 연결된 계정만 찾는다', () => {
    const accounts = [{ id: '1', childId: '2', loginId: 'child1' }]
    expect(accountOfChild(accounts, '2')).toEqual(accounts[0])
    expect(accountOfChild(accounts, '3')).toBeUndefined()
  })
})
