import { reissueAccessToken } from '@/shared/api'
import { env } from '@/shared/config'
import { sessionApi } from '../api/session-api'
import { clearDemoAccount, loadDemoAccount, saveDemoAccount } from './demo-storage'
import type { DemoAccount } from './session'
import { toDevTokenRequest, toMember } from './session.mapper'
import { useSessionStore } from './session-store'

/** 받은 Access Token으로 로그인 상태를 만든다 (토큰 저장 → 내 정보 조회) */
async function signIn(accessToken: string) {
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

/** 시연 계정 토큰만 받는다 (로그인 상태는 바꾸지 않음). 자동 시연 시작 전 점검용 */
export async function issueDemoToken(account: DemoAccount): Promise<string> {
  const { accessToken } = await sessionApi.issueDevToken(toDevTokenRequest(account))
  return accessToken
}

/** 서버의 Refresh Token을 폐기하고 화면의 로그인 상태를 지운다 (Access Token은 만료까지 서버에서 유효) */
export async function signOut() {
  try {
    await sessionApi.logout()
  } finally {
    useSessionStore.getState().clear()
  }
}

/** 시연 기능을 끌 때: 개발용 토큰 세션을 끝내고 기억한 시연 계정도 지운다 (다시 켜도 저절로 로그인되지 않게) */
export async function signOutDemo() {
  clearDemoAccount()
  await signOut()
}

/**
 * 새로고침 · 토스 결제창 복귀 뒤: 기억한 시연 계정으로 다시 발급 → 안 되면 쿠키로 재발급 → 둘 다 없으면 비로그인.
 * 시연 역할 전환은 쿠키를 지우지 않으므로, 쿠키를 먼저 쓰면 예전 카카오 계정으로 바뀌어
 * 시연 계정으로 시작한 충전을 승인하지 못한다 (BE 404 "해당 충전 요청이 없습니다")
 */
export async function restoreSession() {
  const store = useSessionStore.getState()
  store.setStatus('restoring')
  try {
    if (!(await restoreDemoAccount())) {
      await signIn(await reissueAccessToken())
    }
  } catch {
    store.clear()
  } finally {
    store.setStatus('ready')
  }
}

/** 이 탭에서 고른 시연 계정으로 다시 로그인한다. 못 했으면 false */
async function restoreDemoAccount(): Promise<boolean> {
  // 시연 역할 전환을 끈 배포(개발 토큰 없음)에서는 기억한 시연 계정으로 다시 받지 않는다
  const account = env.demoRoleSwitch ? loadDemoAccount() : null
  if (!account) {
    return false
  }
  try {
    await signInAsDemo(account)
    return true
  } catch {
    return false
  }
}

/** 닉네임 수정 · 판매자 승인 뒤 최신 역할을 반영한다 (재발급 → 내 정보 재조회) */
export async function refreshSession() {
  await signIn(await reissueAccessToken())
}

/**
 * 닉네임을 바꾼 뒤 토큰을 다시 받아 화면 · 이후 요청에 새 닉네임을 쓴다 (판매자 신청은 토큰의 닉네임으로 저장됨).
 * 시연 계정은 쿠키가 없으므로 같은 계정으로 개발용 토큰을 다시 발급한다
 */
export async function updateNickname(nickname: string) {
  await sessionApi.updateMe({ nickname: nickname.trim() })
  const account = loadDemoAccount()
  if (account) {
    await signInAsDemo({ ...account, nickname: nickname.trim() })
  } else {
    await refreshSession()
  }
}

/** 탈퇴 요청 뒤 로그인 상태를 지운다 */
export async function withdraw() {
  await sessionApi.withdraw()
  await signOut()
}
