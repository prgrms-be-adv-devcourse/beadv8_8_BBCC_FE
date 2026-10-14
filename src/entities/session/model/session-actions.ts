import { reissueAccessToken } from '@/shared/api'
import { sessionApi } from '../api/session-api'
import { loadDemoAccount, saveDemoAccount } from './demo-storage'
import type { DemoAccount } from './session'
import { toDevTokenRequest, toMember } from './session.mapper'
import { useSessionStore } from './session-store'

/** 받은 Access Token으로 로그인 상태를 만든다 (토큰 저장 → 내 정보 조회) */
export async function signIn(accessToken: string) {
  const store = useSessionStore.getState()
  store.setAccessToken(accessToken)
  try {
    store.setMember(toMember(await sessionApi.getMe()))
  } catch {
    // 개발용 토큰은 회원 행이 없어도 발급된다. 표시는 토큰 정보로 한다
    store.setMember(null)
  }
}

export async function signInWithKakao(code: string) {
  const { accessToken } = await sessionApi.loginWithKakao(code)
  useSessionStore.getState().clear()
  await signIn(accessToken)
}

/** 시연용: 개발용 토큰으로 로그인하고 고른 계정을 탭에 기억한다 */
export async function signInAsDemo(account: DemoAccount) {
  const { accessToken } = await sessionApi.issueDevToken(toDevTokenRequest(account))
  saveDemoAccount(account)
  await signIn(accessToken)
}

/** 서버의 Refresh Token을 폐기하고 화면의 로그인 상태를 지운다 (Access Token은 만료까지 서버에서 유효) */
export async function signOut() {
  try {
    await sessionApi.logout()
  } finally {
    useSessionStore.getState().clear()
  }
}

/** 새로고침 뒤: 쿠키로 재발급 → 안 되면 기억한 시연 계정으로 다시 발급 → 둘 다 없으면 비로그인 */
export async function restoreSession() {
  const store = useSessionStore.getState()
  store.setStatus('restoring')
  try {
    await signIn(await reissueAccessToken())
  } catch {
    const account = loadDemoAccount()
    try {
      if (account) {
        await signInAsDemo(account)
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
