import { useMutation, useQueryClient } from '@tanstack/react-query'
import { childAccountKeys } from '@/entities/child-account'
import { runWithAction } from '@/shared/api'
import { manageChildAccountApi } from '../api/manage-child-account-api'
import { toChildAccountRequest } from './child-account.mapper'

export function useManageChildAccount(childId: string) {
  const queryClient = useQueryClient()
  const onSuccess = () => queryClient.invalidateQueries({ queryKey: childAccountKeys.all })
  const create = useMutation({
    mutationFn: ({ loginId, password }: { loginId: string; password: string }) =>
      runWithAction('자녀 계정 발급', () =>
        manageChildAccountApi.create(toChildAccountRequest(childId, loginId, password)),
      ),
    onSuccess,
  })
  const reset = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      runWithAction('자녀 비밀번호 재설정', () =>
        manageChildAccountApi.resetPassword(id, password),
      ),
    onSuccess,
  })
  const remove = useMutation({
    mutationFn: (id: string) =>
      runWithAction('자녀 계정 삭제', () => manageChildAccountApi.remove(id)),
    onSuccess,
  })
  return { create, reset, remove }
}
