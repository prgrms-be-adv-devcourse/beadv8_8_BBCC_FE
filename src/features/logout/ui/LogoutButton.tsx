import { useMutation, useQueryClient } from '@tanstack/react-query'
import { sessionApi, useSessionStore } from '@/entities/session'
import { runWithAction } from '@/shared/api'
import { Button } from '@/shared/ui/button'

export function LogoutButton() {
  const queryClient = useQueryClient()

  const logout = useMutation({
    mutationFn: () =>
      runWithAction('로그아웃', async () => {
        try {
          await sessionApi.logout()
        } finally {
          // 서버 응답과 상관없이 화면의 로그인 상태는 지운다 (Access Token은 만료까지 서버에서 유효)
          useSessionStore.getState().clear()
          queryClient.clear()
        }
      }),
  })

  return (
    <Button size="sm" variant="ghost" disabled={logout.isPending} onClick={() => logout.mutate()}>
      로그아웃
    </Button>
  )
}
