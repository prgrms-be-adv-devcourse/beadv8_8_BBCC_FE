import { useMutation, useQueryClient } from '@tanstack/react-query'
import { signInAsDemo, useSessionStore, type DemoAccount } from '@/entities/session'
import { runWithAction } from '@/shared/api'

export function useSwitchDemoRole() {
  const queryClient = useQueryClient()
  const currentMemberId = useSessionStore((state) => state.user?.memberId ?? null)

  const mutation = useMutation({
    mutationFn: (account: DemoAccount) =>
      runWithAction(`역할 전환: ${account.label}`, async () => {
        await queryClient.cancelQueries()
        await signInAsDemo(account)
        // 이전 역할의 조회 결과를 버린다. 지금 화면에 떠 있는 조회는 새 역할로 다시 불러온다
        // (clear()만 하면 같은 화면에 머물 때 다시 조회하지 않는다)
        queryClient.removeQueries({ type: 'inactive' })
        await queryClient.resetQueries({ type: 'active' })
      }),
  })

  return { ...mutation, currentMemberId }
}
