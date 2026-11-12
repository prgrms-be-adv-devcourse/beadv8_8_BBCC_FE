import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adminAccountKeys, toAdminAccount } from '@/entities/admin-account'
import { getErrorStatus, runWithAction } from '@/shared/api'
import { toast } from '@/shared/lib'
import { manageAdminAccountApi } from '../api/manage-admin-account-api'

type CreateAdminInput = { email: string; password: string }

/**
 * 관리자 추가. 만들면 관리자 목록을 다시 받는다.
 * 409는 이메일이 겹친 경우뿐이다 (ADMIN_EMAIL_ALREADY_USED, 동시에 같은 이메일로 만들면 공통 CONFLICT라 detail이 달라 따로 안내한다)
 */
export function useCreateAdmin() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (input: CreateAdminInput) =>
      runWithAction('관리자 추가', () => manageAdminAccountApi.create(input)).then(toAdminAccount),
    onSuccess: () => {
      toast('관리자를 추가했어요')
      void queryClient.invalidateQueries({ queryKey: adminAccountKeys.all })
    },
  })
  return { ...mutation, isEmailTaken: getErrorStatus(mutation.error) === 409 }
}

/**
 * 관리자 비활성화 (그 관리자의 로그인 · 재발급이 막힌다). 이미 비활성이어도 성공이다. 성공하면 관리자 목록을 다시 받는다.
 * 409(ADMIN_NOT_DISABLABLE)는 자기 자신, 404(ADMIN_NOT_FOUND)는 없는 관리자다
 */
export function useDisableAdmin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (adminId: string) =>
      runWithAction('관리자 비활성화', () => manageAdminAccountApi.disable(adminId)),
    onSuccess: () => {
      toast('관리자를 비활성화했어요')
      void queryClient.invalidateQueries({ queryKey: adminAccountKeys.all })
    },
  })
}
