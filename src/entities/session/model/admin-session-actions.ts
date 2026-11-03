import { reissueAccessToken } from '@/shared/api'
import { sessionApi } from '../api/session-api'
import { useAdminSessionStore } from './admin-session-store'

/** 관리자 계정(이메일 · 비밀번호)으로 로그인한다. 회원 로그인은 건드리지 않는다 */
export async function signInAdmin(email: string, password: string) {
  const { accessToken } = await sessionApi.loginAsAdmin({ email: email.trim(), password })
  useAdminSessionStore.getState().setAccessToken(accessToken)
}

/** 서버의 관리자 Refresh Token을 폐기하고 관리자 토큰을 지운다 */
export async function signOutAdmin() {
  try {
    await sessionApi.logoutAdmin()
  } finally {
    useAdminSessionStore.getState().clear()
  }
}

/** 새로고침 뒤 관리자 재발급 쿠키로 다시 받는다. 쿠키가 없으면 관리자 로그인 전 */
export async function restoreAdminSession() {
  const store = useAdminSessionStore.getState()
  store.setStatus('restoring')
  try {
    store.setAccessToken(await reissueAccessToken('admin'))
  } catch {
    store.clear()
  } finally {
    store.setStatus('ready')
  }
}
