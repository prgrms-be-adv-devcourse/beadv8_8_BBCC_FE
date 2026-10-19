import { turnOffDemoConfirm, type AppSetting } from '@/entities/app-setting'
import { isDemoSession } from '@/entities/session'
import { getErrorMessage } from '@/shared/api'
import { confirmAction } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useChangeAppSetting } from '../model/use-change-app-setting'

type ToggleAppSettingButtonProps = {
  setting: AppSetting
  /** 켜고 끌 값. 다른 값은 그대로 보낸다 */
  field: keyof AppSetting
}

export function ToggleAppSettingButton({ setting, field }: ToggleAppSettingButtonProps) {
  const change = useChangeAppSetting()
  const isOn = setting[field]

  // 시연 기능을 끄면 시연 계정은 새로고침 뒤 로그아웃되어 다시 켜지 못할 수 있으니 먼저 확인한다
  const toggle = async () => {
    if (field === 'isDemoRoleSwitchEnabled' && isOn) {
      if (!(await confirmAction(turnOffDemoConfirm(isDemoSession())))) return
    }
    change.mutate({ ...setting, [field]: !isOn })
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant={isOn ? 'outline' : 'default'}
        disabled={change.isPending}
        onClick={toggle}
      >
        {isOn ? '끄기' : '켜기'}
      </Button>
      {change.isError && <StateMessage tone="error">{getErrorMessage(change.error)}</StateMessage>}
    </div>
  )
}
