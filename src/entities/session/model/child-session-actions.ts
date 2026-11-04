import { reissueAccessToken } from '@/shared/api'
import { sessionApi } from '../api/session-api'
import { useChildSessionStore } from './child-session-store'

export async function signInChild(loginId: string, password: string) {
  const { accessToken } = await sessionApi.loginAsChild({ loginId: loginId.trim(), password })
  useChildSessionStore.getState().setAccessToken(accessToken)
}

export async function signOutChild() {
  try {
    await sessionApi.logoutChild()
  } finally {
    useChildSessionStore.getState().clear()
  }
}

export async function restoreChildSession() {
  const store = useChildSessionStore.getState()
  store.setStatus('restoring')
  try {
    store.setAccessToken(await reissueAccessToken('child'))
  } catch {
    store.clear()
  } finally {
    store.setStatus('ready')
  }
}
