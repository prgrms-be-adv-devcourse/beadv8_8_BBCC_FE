import type { AppSetting } from '@/entities/app-setting'
import { getErrorMessage } from '@/shared/api'
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
  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant={isOn ? 'outline' : 'default'}
        disabled={change.isPending}
        onClick={() => change.mutate({ ...setting, [field]: !isOn })}
      >
        {isOn ? '끄기' : '켜기'}
      </Button>
      {change.isError && <StateMessage tone="error">{getErrorMessage(change.error)}</StateMessage>}
    </div>
  )
}
