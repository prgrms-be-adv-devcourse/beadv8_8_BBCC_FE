import { useMutation } from '@tanstack/react-query'
import { signInChild } from '@/entities/session'
import { runWithAction } from '@/shared/api'

type ChildLoginInput = { loginId: string; password: string }

// onSuccess는 mutate가 아니라 여기에 둔다: 로그인하면 토큰이 생겨 폼이 바로 사라지는데,
// mutate에 넘긴 콜백은 컴포넌트가 사라지면 불리지 않는다
export function useChildLogin(onSuccess?: () => void) {
  return useMutation({
    onSuccess,
    mutationFn: ({ loginId, password }: ChildLoginInput) =>
      runWithAction('자녀 로그인', () => signInChild(loginId, password)),
  })
}
