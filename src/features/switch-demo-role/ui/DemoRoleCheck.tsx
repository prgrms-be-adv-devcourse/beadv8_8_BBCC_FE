import { getErrorMessage } from '@/shared/api'
import { useDemoRoleSwitch } from '@/shared/config'
import { Button } from '@/shared/ui/button'
import { DEMO_ACCOUNTS } from '../config/demo-accounts'
import { useSwitchDemoRole } from '../model/use-switch-demo-role'

type DemoRoleCheckProps = {
  /** 이 화면에 필요한 시연 역할 이름 (보호자 · 판매자 · 관리자) */
  label: string
}

/** 지금 시연 역할이 다르면 알려 주고 바로 바꾸는 버튼을 보여 준다 (같으면 아무것도 안 그림) */
export function DemoRoleCheck({ label }: DemoRoleCheckProps) {
  const switchRole = useSwitchDemoRole()
  const demoRoleSwitch = useDemoRoleSwitch()
  const account = DEMO_ACCOUNTS.find((candidate) => candidate.label === label)

  if (!demoRoleSwitch || !account || switchRole.currentMemberId === account.memberId) {
    return null
  }
  return (
    <span className="flex flex-wrap items-center gap-2">
      <span className="text-destructive text-xs">지금 역할로는 이 단계를 할 수 없어요.</span>
      <Button size="sm" disabled={switchRole.isPending} onClick={() => switchRole.mutate(account)}>
        {label}로 바꾸기
      </Button>
      {switchRole.isError && (
        <span className="text-destructive text-xs">{getErrorMessage(switchRole.error)}</span>
      )}
    </span>
  )
}
