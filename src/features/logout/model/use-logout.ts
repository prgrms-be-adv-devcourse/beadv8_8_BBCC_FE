import { useMutation, useQueryClient } from '@tanstack/react-query'
import { signOut, signOutAdmin, signOutChild } from '@/entities/session'
import { runWithAction } from '@/shared/api'

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => runWithAction('로그아웃', signOut),
    onSettled: () => queryClient.clear(),
  })
}

/** 관리자 로그아웃 (회원 로그인은 그대로) */
export function useAdminLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => runWithAction('관리자 로그아웃', signOutAdmin),
    onSettled: () => queryClient.clear(),
  })
}

export function useChildLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => runWithAction('자녀 로그아웃', signOutChild),
    onSettled: () => queryClient.clear(),
  })
}
