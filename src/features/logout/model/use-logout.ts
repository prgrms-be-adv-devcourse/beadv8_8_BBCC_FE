import { useMutation, useQueryClient } from '@tanstack/react-query'
import { signOut } from '@/entities/session'
import { runWithAction } from '@/shared/api'

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => runWithAction('로그아웃', signOut),
    onSettled: () => queryClient.clear(),
  })
}
