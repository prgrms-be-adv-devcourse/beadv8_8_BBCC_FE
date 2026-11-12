import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  restoreAdminSession,
  signInAdmin,
  signOutAdmin,
  useAdminSessionStore,
  useSessionStore,
  viewerRoles,
} from '@/entities/session'
import { toAdminId } from '@/entities/session/model/session.mapper'
import { apiClient } from '@/shared/api'

const ADMIN_TOKEN = 'header.admin.signature'
const MEMBER_TOKEN = `header.${btoa(JSON.stringify({ sub: '1', roles: ['BUYER'] }))}.signature`

const tokenResponse = (accessToken: string) => ({
  data: { accessToken },
  status: 200,
  statusText: '',
  headers: {},
  config: {},
})

describe('viewerRoles: 화면 노출용 역할 (BE #755부터 관리자는 회원 역할이 아니라 관리자 로그인)', () => {
  const user = (roles: ('BUYER' | 'SELLER')[]) => ({
    memberId: '3',
    nickname: '회원3',
    roles,
  })

  it('관리자로 로그인했으면 ADMIN을 더한다 (회원 로그인과 따로)', () => {
    expect(viewerRoles(user(['BUYER']), true)).toEqual(['BUYER', 'ADMIN'])
    expect(viewerRoles(null, true)).toEqual(['ADMIN'])
  })

  it('관리자로 로그인하지 않았으면 회원 역할만 (회원 토큰의 ADMIN은 매퍼가 버린다)', () => {
    expect(viewerRoles(user(['BUYER', 'SELLER']), false)).toEqual(['BUYER', 'SELLER'])
    expect(viewerRoles(null, false)).toEqual([])
  })
})

describe('관리자 로그인 상태', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    useAdminSessionStore.setState({ accessToken: null, status: 'idle' })
    useSessionStore.setState({ accessToken: null, user: null, member: null })
  })

  it('이메일 · 비밀번호로 로그인하면 관리자 토큰만 저장하고 회원 로그인은 그대로 둔다', async () => {
    useSessionStore.getState().setAccessToken(MEMBER_TOKEN)
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue(tokenResponse(ADMIN_TOKEN))

    await signInAdmin(' admin@kidly.local ', 'local-admin-password')

    expect(post).toHaveBeenCalledWith(
      '/auth/admin/login',
      { email: 'admin@kidly.local', password: 'local-admin-password' },
      { skipAuth: true },
    )
    expect(useAdminSessionStore.getState().accessToken).toBe(ADMIN_TOKEN)
    expect(useSessionStore.getState().accessToken).toBe(MEMBER_TOKEN)
  })

  it('새로고침 뒤 관리자 재발급 쿠키로 관리자 토큰을 다시 받는다', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue(tokenResponse(ADMIN_TOKEN))

    await restoreAdminSession()

    expect(post.mock.calls[0]?.[0]).toBe('/auth/admin/reissue')
    expect(useAdminSessionStore.getState()).toMatchObject({
      accessToken: ADMIN_TOKEN,
      status: 'ready',
    })
  })

  it('관리자 재발급 쿠키가 없으면 관리자 로그인 전', async () => {
    vi.spyOn(apiClient, 'post').mockRejectedValue(new Error('401'))

    await restoreAdminSession()

    expect(useAdminSessionStore.getState()).toMatchObject({ accessToken: null, status: 'ready' })
  })

  it('로그아웃은 관리자 로그아웃 API를 부르고 관리자 토큰만 지운다', async () => {
    useSessionStore.getState().setAccessToken(MEMBER_TOKEN)
    useAdminSessionStore.getState().setAccessToken(ADMIN_TOKEN)
    const post = vi
      .spyOn(apiClient, 'post')
      .mockResolvedValue({ ...tokenResponse(''), status: 204 })

    await signOutAdmin()

    expect(post).toHaveBeenCalledWith('/auth/admin/logout', undefined, { skipAuth: true })
    expect(useAdminSessionStore.getState().accessToken).toBeNull()
    expect(useSessionStore.getState().accessToken).toBe(MEMBER_TOKEN)
  })
})

describe('관리자 토큰 → 내 관리자 ID (BE PrincipalId: 관리자 sub는 "admin:7")', () => {
  const token = (claims: object) =>
    `h.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.s`

  it('sub의 admin: 뒤 숫자를 읽는다', () => {
    expect(toAdminId(token({ sub: 'admin:7' }))).toBe('7')
  })

  it('관리자 주체가 아니면 모른다 (회원 sub는 숫자 그대로, 자녀는 child:)', () => {
    expect(toAdminId(token({ sub: '42' }))).toBeNull()
    expect(toAdminId(token({ sub: 'child:3' }))).toBeNull()
    expect(toAdminId(token({ sub: 'admin:' }))).toBeNull()
  })

  it('로그인 전이거나 읽을 수 없는 토큰이면 모른다 (그때는 서버의 409 안내에 맡긴다)', () => {
    expect(toAdminId(null)).toBeNull()
    expect(toAdminId(ADMIN_TOKEN)).toBeNull()
  })
})
