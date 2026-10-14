import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { DEMO_ACCOUNTS } from '../config/demo-accounts'
import { useSwitchDemoRole } from '../model/use-switch-demo-role'

/** 시연용: 개발용 토큰(local 전용)으로 보호자 · 판매자 · 관리자를 바로 바꾼다 */
export function SwitchDemoRole() {
  const switchRole = useSwitchDemoRole()

  return (
    <div className="flex items-center gap-1">
      <span className="text-muted-foreground mr-1 text-xs">시연 역할</span>
      {DEMO_ACCOUNTS.map((account) => (
        <Button
          key={account.label}
          size="sm"
          variant={switchRole.currentMemberId === account.memberId ? 'default' : 'outline'}
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
