import { useMutation, useQueryClient } from '@tanstack/react-query'
import { signInAsDemo, useSessionStore } from '@/entities/session'
import { getErrorMessage, runWithAction } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { DEMO_ACCOUNTS } from '../config/demo-accounts'

/** 시연용: 개발용 토큰(local 전용)으로 보호자 · 판매자 · 관리자를 바로 바꾼다 */
export function SwitchDemoRole() {
  const queryClient = useQueryClient()
  const memberId = useSessionStore((state) => state.user?.memberId)

  const switchRole = useMutation({
    mutationFn: ({ label, request }: (typeof DEMO_ACCOUNTS)[number]) =>
      runWithAction(`역할 전환: ${label}`, async () => {
        // 이전 역할의 조회 결과가 남지 않게 비운다
        queryClient.clear()
        await signInAsDemo(request)
      }),
  })

  return (
    <div className="flex items-center gap-1">
      <span className="text-muted-foreground mr-1 text-xs">시연 역할</span>
      {DEMO_ACCOUNTS.map((account) => (
        <Button
          key={account.label}
          size="sm"
          variant={memberId === account.request.memberId ? 'default' : 'outline'}
          disabled={switchRole.isPending}
          onClick={() => switchRole.mutate(account)}
        >
          {account.label}
        </Button>
      ))}
      {switchRole.isError && (
        <span className="text-destructive ml-2 text-xs">{getErrorMessage(switchRole.error)}</span>
      )}
    </div>
  )
}
