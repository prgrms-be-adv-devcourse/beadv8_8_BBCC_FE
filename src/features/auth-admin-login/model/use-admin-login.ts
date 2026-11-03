import { useMutation } from '@tanstack/react-query'
import { signInAdmin } from '@/entities/session'
import { runWithAction } from '@/shared/api'

type AdminLoginInput = { email: string; password: string }

/** 관리자 계정 로그인 (회원 로그인과 따로). 실패는 이유를 가리지 않고 같은 401이다 */
export function useAdminLogin() {
  return useMutation({
    mutationFn: ({ email, password }: AdminLoginInput) =>
      runWithAction('관리자 로그인', () => signInAdmin(email, password)),
  })
}
