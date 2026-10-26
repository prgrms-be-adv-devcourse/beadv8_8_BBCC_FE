import { useId, type ReactNode } from 'react'
import { reloadNotice, useAppSettingQuery, type AppSetting } from '@/entities/app-setting'
import { isDemoSession } from '@/entities/session'
import { ToggleAppSettingButton } from '@/features/change-app-setting'
import { getErrorMessage } from '@/shared/api'
import { appSettings } from '@/shared/config'
import { cn } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
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
    title: '시연 기능',
    description: '역할 전환 · 시연 콘솔 · API 흐름 패널을 보여 줘요. 끄면 카카오 로그인만 남아요.',
  },
]

/**
 * 관리자 설정: 목 데이터 · 시연 기능(역할 전환 · 시연 콘솔 · API 흐름)을 켜고 끈다 (모든 방문자에게 적용).
 * 「이름 · 설명 · 상태 · 켜기/끄기」 한 줄씩
 */
export function AdminSettingsPage() {
  const setting = useAppSettingQuery()
  const notice = setting.data
    ? reloadNotice(appSettings.current(), setting.data, isDemoSession())
    : null

  return (
    <div className="shop-look max-w-2xl space-y-6">
      <PageHeader
        title="설정"
        description="목 데이터와 시연 기능을 켜고 꺼요. 모든 방문자에게 적용돼요."
        note="바꾸면 이 화면에는 바로 적용돼요. 다른 방문자는 새로고침하면 바뀌어요."
      />
      {setting.isPending && <StateMessage>불러오는 중…</StateMessage>}
      {setting.isError && (
        <StateMessage tone="error">{getErrorMessage(setting.error)}</StateMessage>
      )}
      {notice && (
        <div className="bg-paper-2 flex flex-col gap-3 rounded-lg px-5 py-4 text-sm sm:flex-row sm:items-center">
          <p className="text-ink min-w-0 flex-1">{notice}</p>
          <Button
            className="self-end max-lg:h-11 sm:self-auto"
            onClick={() => window.location.reload()}
          >
            새로고침
          </Button>
        </div>
      )}
      {setting.data && (
        <div className="border-rule divide-rule divide-y rounded-lg border">
          {SETTING_ITEMS.map((item) => (
            <SettingRow
              key={item.field}
              title={item.title}
              description={item.description}
              isOn={setting.data[item.field]}
              action={<ToggleAppSettingButton setting={setting.data} field={item.field} />}
            />
          ))}
        </div>
      )}
    </div>
  )
}

type SettingRowProps = {
  title: string
  description: string
  isOn: boolean
  action: ReactNode
}

/** 설정 한 줄 (이름으로 찾을 수 있게 제목을 구역 이름으로 연결): 이름 · 설명 | 켜짐/꺼짐 · 바꾸기 */
function SettingRow({ title, description, isOn, action }: SettingRowProps) {
  const titleId = useId()
  return (
    <section
      aria-labelledby={titleId}
      className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-6"
    >
      <div className="min-w-0 flex-1 space-y-0.5">
        <h2 id={titleId} className="text-ink text-[15px] font-bold">
          {title}
        </h2>
        <p className="text-ink-3 text-[13px]">{description}</p>
      </div>
      <div className="flex shrink-0 items-center gap-4 self-end sm:self-auto">
        <span className={cn('text-sm font-semibold', isOn ? 'text-signal' : 'text-ink-3')}>
          {isOn ? '켜짐' : '꺼짐'}
        </span>
        {action}
      </div>
    </section>
  )
}
