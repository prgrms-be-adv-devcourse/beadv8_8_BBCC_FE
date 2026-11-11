import { useAdminSessionStore, useChildSessionStore, useSessionStore } from '@/entities/session'
import { configureAuth } from '@/shared/api'
import { queryClient } from './query-client'

/** 공통 클라이언트(shared/api)와 세션(entities/session)을 연결한다. 회원 · 관리자는 토큰 · 재발급이 따로다 */
export function setupAuth() {
  configureAuth('member', {
    getAccessToken: () => useSessionStore.getState().accessToken,
    onTokenReissued: (accessToken) => useSessionStore.getState().setAccessToken(accessToken),
    onAuthFailed: () => {
      const hadSession = useSessionStore.getState().accessToken !== null
      useSessionStore.getState().clear()
      // 로그인하지 않은 채 받은 401이면 지울 로그인 데이터가 없다. 캐시를 지우면 진행 중인 공개 조회(상품 상세)가 결과를 잃는다
      if (hadSession) queryClient.clear()
    },
  })
  configureAuth('child', {
    getAccessToken: () => useChildSessionStore.getState().accessToken,
    onTokenReissued: (accessToken) => useChildSessionStore.getState().setAccessToken(accessToken),
    onAuthFailed: () => {
      const hadSession = useChildSessionStore.getState().accessToken !== null
      useChildSessionStore.getState().clear()
      if (hadSession) queryClient.clear()
    },
  })
  configureAuth('admin', {
    getAccessToken: () => useAdminSessionStore.getState().accessToken,
    onTokenReissued: (accessToken) => useAdminSessionStore.getState().setAccessToken(accessToken),
    // 관리자 화면은 AdminGate가 로그인 폼으로 바꾼다
    onAuthFailed: () => useAdminSessionStore.getState().clear(),
  })
}
