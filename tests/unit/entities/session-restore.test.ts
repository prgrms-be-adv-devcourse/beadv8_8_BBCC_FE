import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { restoreSession, useSessionStore } from '@/entities/session'
import { apiClient } from '@/shared/api'
import { appSettings } from '@/shared/config'

const DEMO_ACCOUNT = { label: '보호자', memberId: '1', nickname: '보호자', roles: ['BUYER'] }
const KAKAO_MEMBER_ID = '7'

function tokenOf(memberId: string) {
  const payload = btoa(JSON.stringify({ sub: memberId, roles: ['BUYER'] }))
  return `header.${payload}.signature`
}

function memoryStorage(entries: Record<string, string>) {
  const map = new Map(Object.entries(entries))
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
    removeItem: (key: string) => void map.delete(key),
  }
}

type Responses = { reissue: string | null; devToken: string | null }

// 재발급(쿠키) · 개발용 토큰 발급 응답을 정한다. null이면 그 요청은 실패한다
function stubAuthApi({ reissue, devToken }: Responses) {
  vi.spyOn(apiClient, 'post').mockImplementation(async (url) => {
    const accessToken = url === '/auth/reissue' ? reissue : url === '/dev/tokens' ? devToken : null
    if (!accessToken) throw new Error(`${url} 실패`)
    return { data: { accessToken }, status: 200, statusText: '', headers: {}, config: {} }
  })
  vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('회원 정보 없음'))
}

const restoredMemberId = () => useSessionStore.getState().user?.memberId ?? null

describe('새로고침 · 토스 결제창 복귀 뒤 로그인 복구', () => {
  const initialSettings = appSettings.current()

  beforeEach(() => {
    vi.stubGlobal(
      'sessionStorage',
      memoryStorage({ 'kidly.demo-account': JSON.stringify(DEMO_ACCOUNT) }),
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    appSettings.apply(initialSettings)
    useSessionStore.setState({ accessToken: null, user: null, member: null })
  })

  it('이 탭에서 고른 시연 계정이 있으면 다른 계정의 재발급 쿠키보다 먼저 복구한다', async () => {
    stubAuthApi({ reissue: tokenOf(KAKAO_MEMBER_ID), devToken: tokenOf(DEMO_ACCOUNT.memberId) })

    await restoreSession()

    expect(restoredMemberId()).toBe(DEMO_ACCOUNT.memberId)
  })

  it('시연 계정 토큰을 받지 못하면 쿠키로 재발급한다', async () => {
    stubAuthApi({ reissue: tokenOf(KAKAO_MEMBER_ID), devToken: null })

    await restoreSession()

    expect(restoredMemberId()).toBe(KAKAO_MEMBER_ID)
  })

  it('시연 기능이 꺼져 있으면 기억한 시연 계정을 쓰지 않고 쿠키로 재발급한다', async () => {
    appSettings.apply({ ...initialSettings, isDemoRoleSwitchEnabled: false })
    stubAuthApi({ reissue: tokenOf(KAKAO_MEMBER_ID), devToken: tokenOf(DEMO_ACCOUNT.memberId) })

    await restoreSession()

    expect(restoredMemberId()).toBe(KAKAO_MEMBER_ID)
  })

  it('시연 계정 · 쿠키가 모두 없으면 비로그인', async () => {
    vi.stubGlobal('sessionStorage', memoryStorage({}))
    stubAuthApi({ reissue: null, devToken: null })

    await restoreSession()

    expect(restoredMemberId()).toBeNull()
    expect(useSessionStore.getState().status).toBe('ready')
  })
})
