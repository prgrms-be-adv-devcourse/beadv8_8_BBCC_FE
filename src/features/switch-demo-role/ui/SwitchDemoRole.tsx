import { getErrorMessage } from '@/shared/api'
import { useDemoRoleSwitch } from '@/shared/config'
import { Button } from '@/shared/ui/button'
import { DEMO_ACCOUNTS } from '../config/demo-accounts'
import { useSwitchDemoRole } from '../model/use-switch-demo-role'

type SwitchDemoRoleProps = {
  /** 역할을 바꾼 뒤 (예: 로그인 화면에서 원래 화면으로 돌아가기) */
  onSwitched?: () => void
}

/** 시연용: 개발용 토큰(local 전용)으로 보호자 · 판매자 · 관리자를 바로 바꾼다 */
export function SwitchDemoRole({ onSwitched }: SwitchDemoRoleProps = {}) {
  const switchRole = useSwitchDemoRole()
  const demoRoleSwitch = useDemoRoleSwitch()

  if (!demoRoleSwitch) return null
  return (
    <div className="flex items-center gap-1">
      <span className="text-muted-foreground mr-1 text-xs">시연 역할</span>
      {DEMO_ACCOUNTS.map((account) => (
        <Button
          key={account.label}
          size="sm"
          variant={switchRole.currentMemberId === account.memberId ? 'default' : 'outline'}
          disabled={switchRole.isPending}
          onClick={() => switchRole.mutate(account, { onSuccess: onSwitched })}
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
