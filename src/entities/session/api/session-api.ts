import { apiClient, reissueAccessToken } from '@/shared/api'
import { loadDemoRequest, saveDemoRequest } from '../model/demo-storage'
import { useSessionStore } from '../model/session-store'
import type { DevTokenRequest, Member, TokenResponse } from '../model/types'

export const sessionApi = {
  /** 카카오 인가 코드로 로그인. 처음이면 가입된다. Refresh Token은 쿠키로 온다 */
  loginWithKakao: (code: string) =>
    apiClient
      .post<TokenResponse>('/auth/login/kakao', { code }, { skipAuth: true })
      .then((response) => response.data),

  issueDevToken: (request: DevTokenRequest) =>
    apiClient
      .post<TokenResponse>('/dev/tokens', request, { skipAuth: true })
      .then((response) => response.data),

  /** 쿠키가 없어도 204 */
  logout: () => apiClient.post<void>('/auth/logout', undefined, { skipAuth: true }),

  getMe: () => apiClient.get<Member>('/members/me').then((response) => response.data),
}

/** 받은 Access Token으로 로그인 상태를 만든다 (토큰 저장 → 내 정보 조회) */
export async function signIn(accessToken: string) {
  const store = useSessionStore.getState()
  store.setAccessToken(accessToken)
  try {
    store.setMember(await sessionApi.getMe())
  } catch {
    // 개발용 토큰은 회원 행이 없어도 발급된다. 표시는 토큰 정보로 한다
    store.setMember(null)
  }
}

/** 시연용: 개발용 토큰으로 로그인하고 고른 역할을 탭에 기억한다 */
export async function signInAsDemo(request: DevTokenRequest) {
  const { accessToken } = await sessionApi.issueDevToken(request)
  saveDemoRequest(request)
  await signIn(accessToken)
}

/** 새로고침 뒤: 쿠키로 재발급 → 안 되면 기억한 시연 역할로 다시 발급 → 둘 다 없으면 비로그인 */
export async function restoreSession() {
  const store = useSessionStore.getState()
  store.setStatus('restoring')
  try {
    await signIn(await reissueAccessToken())
  } catch {
    const demoRequest = loadDemoRequest()
    try {
      if (demoRequest) {
        await signInAsDemo(demoRequest)
      }
    } catch {
      store.clear()
    }
  } finally {
    store.setStatus('ready')
  }
}

/** 닉네임 수정 · 판매자 승인 뒤 최신 역할을 반영한다 (재발급 → 내 정보 재조회) */
export async function refreshSession() {
  await signIn(await reissueAccessToken())
}
