import { useSessionStore } from '@/entities/session'
import { configureAuth } from '@/shared/api'
import { queryClient } from './query-client'

/** 공통 클라이언트(shared/api)와 세션(entities/session)을 연결한다 */
export function setupAuth() {
  configureAuth({
    getAccessToken: () => useSessionStore.getState().accessToken,
    onTokenReissued: (accessToken) => useSessionStore.getState().setAccessToken(accessToken),
    onAuthFailed: () => {
      useSessionStore.getState().clear()
      queryClient.clear()
    },
  })
}
