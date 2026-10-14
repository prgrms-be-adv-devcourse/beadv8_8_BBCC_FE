import { QueryClient } from '@tanstack/react-query'
import { getErrorStatus } from '@/shared/api'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      // 4xx는 다시 보내도 같은 결과라 재시도하지 않는다
      retry: (failureCount, error) => {
        const status = getErrorStatus(error)
        return (status === null || status >= 500) && failureCount < 1
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
})
