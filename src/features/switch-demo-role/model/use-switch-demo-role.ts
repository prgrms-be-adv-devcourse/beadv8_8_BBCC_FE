import { useMutation, useQueryClient } from '@tanstack/react-query'
import { signInAsDemo, useSessionStore, type DemoAccount } from '@/entities/session'
import { runWithAction } from '@/shared/api'

export function useSwitchDemoRole() {
  const queryClient = useQueryClient()
  const currentMemberId = useSessionStore((state) => state.user?.memberId ?? null)

  const mutation = useMutation({
    mutationFn: (account: DemoAccount) =>
      runWithAction(`역할 전환: ${account.label}`, async () => {
        // 이전 역할의 조회 결과가 남지 않게 비운다
        queryClient.clear()
        await signInAsDemo(account)
      }),
  })

  return { ...mutation, currentMemberId }
}
