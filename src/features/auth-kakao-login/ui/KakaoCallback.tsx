import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router'
import { sessionApi, signIn, useSessionStore } from '@/entities/session'
import { getErrorMessage, runWithAction } from '@/shared/api'
import { StateMessage } from '@/shared/ui/page-header'

/** 카카오가 넘긴 인가 코드로 로그인한다. 처음이면 서버가 가입 처리한다 */
export function KakaoCallback({ code }: { code: string | null }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const started = useRef(false)

  const login = useMutation({
    mutationFn: (authorizationCode: string) =>
      runWithAction('카카오 로그인', async () => {
        const { accessToken } = await sessionApi.loginWithKakao(authorizationCode)
        useSessionStore.getState().clear()
        queryClient.clear()
        await signIn(accessToken)
      }),
    onSuccess: () => navigate('/', { replace: true }),
  })

  useEffect(() => {
    // 인가 코드는 한 번만 쓸 수 있다 (StrictMode 두 번 실행 방지)
    if (code && !started.current) {
      started.current = true
      login.mutate(code)
    }
  }, [code, login])

  if (!code)
    return <StateMessage tone="error">인가 코드가 없어요. 다시 로그인해 주세요.</StateMessage>
  if (login.isError)
    return (
      <div className="space-y-2">
        <StateMessage tone="error">{getErrorMessage(login.error)}</StateMessage>
        <Link to="/login" className="text-primary underline">
          다시 로그인
        </Link>
      </div>
    )
  return <StateMessage>카카오 계정 확인 중…</StateMessage>
}
