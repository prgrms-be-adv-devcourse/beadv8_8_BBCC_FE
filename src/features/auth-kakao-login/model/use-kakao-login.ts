import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { signInWithKakao } from '@/entities/session'
import { runWithAction } from '@/shared/api'

/** 카카오가 넘긴 인가 코드로 한 번만 로그인한다 (인가 코드는 한 번만 쓸 수 있다) */
export function useKakaoLogin(code: string | null, { onSuccess }: { onSuccess: () => void }) {
  const queryClient = useQueryClient()
  const started = useRef(false)

  const mutation = useMutation({
    mutationFn: (authorizationCode: string) =>
      runWithAction('카카오 로그인', async () => {
        queryClient.clear()
        await signInWithKakao(authorizationCode)
      }),
    onSuccess,
  })
  const { mutate } = mutation

  useEffect(() => {
    if (code && !started.current) {
      started.current = true
      mutate(code)
    }
  }, [code, mutate])

  return mutation
}
