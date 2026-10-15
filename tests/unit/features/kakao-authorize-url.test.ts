import { describe, expect, it } from 'vitest'

import {
  isEmailRequired,
  kakaoAuthorizeUrl,
} from '@/features/auth-kakao-login/lib/kakao-authorize-url'

describe('kakaoAuthorizeUrl', () => {
  it('scope가 없으면 기본 동의 화면 주소', () => {
    const url = new URL(kakaoAuthorizeUrl('id', 'http://localhost/cb'))
    expect(url.searchParams.get('scope')).toBeNull()
    expect(url.searchParams.get('response_type')).toBe('code')
  })
  it('이메일 재동의는 scope=account_email', () => {
    const url = new URL(kakaoAuthorizeUrl('id', 'http://localhost/cb', 'account_email'))
    expect(url.searchParams.get('scope')).toBe('account_email')
  })
})

describe('isEmailRequired', () => {
  it('400 + 이메일 문구일 때만', () => {
    expect(isEmailRequired(400, '카카오 계정 이메일 제공 동의가 필요합니다')).toBe(true)
    expect(isEmailRequired(400, '잘못된 인가 코드입니다')).toBe(false)
    expect(isEmailRequired(500, '이메일')).toBe(false)
  })
})
