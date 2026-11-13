import { useId } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { appSettings, useAppSettings, type AppSettingValues } from '@/shared/config'
import { cn, toast } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { PageHeader } from '@/shared/ui/PageHeader'

const SETTINGS: {
  key: keyof AppSettingValues
  title: string
  /** 알림 문구의 목적어 (예: 시연 데이터를) */
  object: string
  description: string
}[] = [
  {
    key: 'isMockEnabled',
    title: '시연 데이터',
    object: '시연 데이터를',
    description:
      '쇼핑 목록에서 사진이 없는 상품에 예시 사진을 보여 줘요. 끄면 기본 이미지를 보여 줘요.',
  },
  {
    key: 'isDemoRoleSwitchEnabled',
    title: '시연 기능',
    object: '시연 기능을',
    description:
      '화면 위 시연 막대(영역 이동 · 시연 역할 바꾸기 · API 흐름)와 시연 콘솔을 보여 줘요. 끄면 카카오 로그인만 써요.',
  },
]

function SettingSwitch({ setting }: { setting: (typeof SETTINGS)[number] }) {
  const enabled = useAppSettings((state) => state[setting.key])
  const queryClient = useQueryClient()
  const titleId = useId()

  const handleToggle = () => {
    const next = !enabled
    appSettings.save(setting.key, next)
    // 켜고 끈 뒤 화면이 바로 바뀐 설정으로 다시 불러오게 한다
    void queryClient.invalidateQueries()
    toast(`${setting.object} ${next ? '켰어요' : '껐어요'}`)
  }

  return (
    <section
      aria-labelledby={titleId}
      className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-6"
    >
      <div className="min-w-0 flex-1 space-y-0.5">
        <h2 id={titleId} className="text-ink text-[15px] font-bold">
          {setting.title}
        </h2>
        <p className="text-ink-3 text-[13px]">{setting.description}</p>
      </div>
      <div className="flex shrink-0 items-center gap-4 self-end sm:self-auto">
        <span className={cn('text-sm font-semibold', enabled ? 'text-signal' : 'text-ink-3')}>
          {enabled ? '켜짐' : '꺼짐'}
        </span>
        <Button
          variant="outline"
          role="switch"
          aria-checked={enabled}
          aria-labelledby={titleId}
          className="max-lg:h-11"
          onClick={handleToggle}
        >
          {enabled ? '끄기' : '켜기'}
        </Button>
      </div>
    </section>
  )
}

/**
 * 관리자 설정: 시연 데이터(쇼핑 목록의 예시 사진) · 시연 기능을 켜고 끈다.
 * 저장할 백엔드 API가 없어 이 브라우저에만 기억한다 (다른 방문자에게는 적용되지 않는다)
 */
export function AdminSettingsPage() {
  return (
    <div className="shop-look max-w-2xl space-y-6">
      <PageHeader
        title="설정"
        description="시연 데이터 · 시연 기능 사용 여부를 정해요. 이 브라우저에만 적용돼요."
      />
      <div className="border-rule divide-rule divide-y rounded-lg border">
        {SETTINGS.map((setting) => (
          <SettingSwitch key={setting.key} setting={setting} />
        ))}
      </div>
    </div>
  )
}
