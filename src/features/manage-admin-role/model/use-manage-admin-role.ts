import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adminMemberApi, memberKeys } from '@/entities/member'
import { runWithAction } from '@/shared/api'

/** 관리자 지정. 대상 회원이 새로고침(토큰 재발급)해야 관리자 메뉴가 생긴다 */
export function useGrantAdmin(memberId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => runWithAction('관리자 지정', () => adminMemberApi.grantAdmin(memberId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: memberKeys.all }),
  })
}

/** 관리자 권한 해제. 대상 회원이 새로고침(토큰 재발급)해야 관리자 메뉴가 빠진다 */
export function useRevokeAdmin(memberId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => runWithAction('관리자 권한 해제', () => adminMemberApi.revokeAdmin(memberId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: memberKeys.all }),
  })
}
