import { useMutation } from '@tanstack/react-query'
import { getErrorStatus, runWithAction } from '@/shared/api'
import { toast } from '@/shared/lib'
import { manageAdminAccountApi } from '../api/manage-admin-account-api'
import { toAdminAccount } from './admin-account.mapper'

type CreateAdminInput = { email: string; password: string }

/**
 * 관리자 추가. 관리자 목록 조회가 없어 다시 부를 캐시가 없다.
 * 409는 이메일이 겹친 경우뿐이다 (BE는 DB 유니크 충돌을 공통 CONFLICT로 내보내 detail이 "잠시 후 다시 시도"라 따로 안내한다)
 */
export function useCreateAdmin() {
  const mutation = useMutation({
    mutationFn: (input: CreateAdminInput) =>
      runWithAction('관리자 추가', () => manageAdminAccountApi.create(input)).then(toAdminAccount),
    onSuccess: () => toast('관리자를 추가했어요'),
  })
  return { ...mutation, isEmailTaken: getErrorStatus(mutation.error) === 409 }
}

/**
 * 관리자 비활성화 (그 관리자의 로그인 · 재발급이 막힌다). 이미 비활성이어도 성공이다.
 * 409(ADMIN_NOT_DISABLABLE)는 자기 자신, 404(ADMIN_NOT_FOUND)는 없는 관리자다
 */
export function useDisableAdmin() {
  return useMutation({
    mutationFn: (adminId: string) =>
      runWithAction('관리자 비활성화', () => manageAdminAccountApi.disable(adminId)),
    onSuccess: () => toast('관리자를 비활성화했어요'),
  })
}
