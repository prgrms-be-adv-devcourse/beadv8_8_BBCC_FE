import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useEffect, type ReactNode } from 'react'
import { restoreSession } from '@/entities/session'
import { queryClient } from './query-client'

let restoreStarted = false

type AppProvidersProps = { children: ReactNode }

export function AppProviders({ children }: AppProvidersProps) {
  useEffect(() => {
    // StrictMode에서 effect가 두 번 실행돼도 복원은 한 번만
    if (!restoreStarted) {
      restoreStarted = true
      void restoreSession()
    }
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
    </QueryClientProvider>
  )
}
