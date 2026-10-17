import { needsReload, useAppSettingQuery, type AppSetting } from '@/entities/app-setting'
import { ToggleAppSettingButton } from '@/features/change-app-setting'
import { getErrorMessage } from '@/shared/api'
import { appSettings } from '@/shared/config'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StateMessage } from '@/shared/ui/StateMessage'

const SETTING_ITEMS: { field: keyof AppSetting; title: string; description: string }[] = [
  {
    field: 'isMockEnabled',
    title: '목 데이터',
    description:
      '백엔드에 아직 없는 API를 목 응답으로 대신해요. 끄면 모든 화면이 실제 서버만 불러요.',
  },
  {
    field: 'isDemoRoleSwitchEnabled',
    title: '시연 역할 전환',
    description:
      '보호자 · 판매자 · 관리자 전환, 시연 콘솔, API 흐름 패널을 보여 줘요. 끄면 카카오 로그인만 보여요. 개발용 토큰이 있는 서버(dev)에서만 전환이 동작해요.',
  },
]

/** 관리자 설정: 목 데이터 · 시연 역할 전환을 켜고 끈다 (모든 방문자에게 적용) */
export function AdminSettingsPage() {
  const setting = useAppSettingQuery()

  return (
    <div className="space-y-4">
      <PageHeader
        title="설정"
        description="목 데이터와 시연 역할 전환을 켜고 꺼요. 모든 방문자에게 적용돼요."
        note="바꾼 값은 앱이 시작할 때 적용돼요. 다른 방문자도 새로고침하면 바뀌어요."
      />
      {setting.isPending && <StateMessage>불러오는 중…</StateMessage>}
      {setting.isError && (
        <StateMessage tone="error">{getErrorMessage(setting.error)}</StateMessage>
      )}
      {setting.data && needsReload(appSettings.current(), setting.data) && (
        <Card className="flex flex-wrap items-center gap-3 text-sm">
          <span>바꾼 설정은 새로고침하면 이 화면에 적용돼요.</span>
          <Button size="sm" className="ml-auto" onClick={() => window.location.reload()}>
            새로고침
          </Button>
        </Card>
      )}
      {setting.data &&
        SETTING_ITEMS.map((item) => (
          <Card key={item.field} className="flex flex-wrap items-center gap-3 text-sm">
            <div className="min-w-0 flex-1">
              <p className="font-medium">{item.title}</p>
              <p className="text-muted-foreground text-xs">{item.description}</p>
            </div>
            <Badge variant={setting.data[item.field] ? 'success' : 'muted'}>
              {setting.data[item.field] ? '켜짐' : '꺼짐'}
            </Badge>
            <ToggleAppSettingButton setting={setting.data} field={item.field} />
          </Card>
        ))}
    </div>
  )
}
