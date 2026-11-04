import { useAdminSessionStore, useChildSessionStore, useSessionStore } from '@/entities/session'
import { configureAuth } from '@/shared/api'
import { queryClient } from './query-client'

/** 공통 클라이언트(shared/api)와 세션(entities/session)을 연결한다. 회원 · 관리자는 토큰 · 재발급이 따로다 */
export function setupAuth() {
  configureAuth('member', {
    getAccessToken: () => useSessionStore.getState().accessToken,
    onTokenReissued: (accessToken) => useSessionStore.getState().setAccessToken(accessToken),
    onAuthFailed: () => {
      useSessionStore.getState().clear()
      queryClient.clear()
    },
  })
  configureAuth('child', {
    getAccessToken: () => useChildSessionStore.getState().accessToken,
    onTokenReissued: (accessToken) => useChildSessionStore.getState().setAccessToken(accessToken),
    onAuthFailed: () => {
      useChildSessionStore.getState().clear()
      queryClient.clear()
    },
  })
  configureAuth('admin', {
    getAccessToken: () => useAdminSessionStore.getState().accessToken,
    onTokenReissued: (accessToken) => useAdminSessionStore.getState().setAccessToken(accessToken),
    // 관리자 화면은 AdminGate가 로그인 폼으로 바꾼다
    onAuthFailed: () => useAdminSessionStore.getState().clear(),
  })
}
