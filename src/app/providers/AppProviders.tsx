import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useEffect, type ReactNode } from 'react'
import { restoreSession } from '@/entities/session'
import { useWebPushSync } from '@/features/subscribe-web-push'
import { useApplyTheme } from '@/features/theme-lab'
import { queryClient } from './query-client'

let restoreStarted = false

/** 회원 웹 푸시: 로그인하면 등록 갱신 · 탭이 열려 있을 때 온 알림으로 알림함 갱신 (QueryClient 안에서) */
function WebPushSync() {
  useWebPushSync()
  return null
}

type AppProvidersProps = { children: ReactNode }

export function AppProviders({ children }: AppProvidersProps) {
  // 테마 바꿔 보기 (각자 브라우저에 저장한 색)
  useApplyTheme()
  useEffect(() => {
    // StrictMode에서 effect가 두 번 실행돼도 복원은 한 번만
    if (!restoreStarted) {
      restoreStarted = true
      void restoreSession()
    }
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <WebPushSync />
      {children}
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
    </QueryClientProvider>
  )
}
