import { useMutation } from '@tanstack/react-query'
import { signInChild } from '@/entities/session'
import { runWithAction } from '@/shared/api'

type ChildLoginInput = { loginId: string; password: string }

export function useChildLogin() {
  return useMutation({
    mutationFn: ({ loginId, password }: ChildLoginInput) =>
      runWithAction('자녀 로그인', () => signInChild(loginId, password)),
  })
}
