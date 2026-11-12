import { useId } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { appSettings, useAppSettings } from '@/shared/config'
import { cn, toast } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { PageHeader } from '@/shared/ui/PageHeader'

/**
 * 관리자 설정: 시연 데이터(쇼핑 목록의 예시 사진)를 켜고 끈다.
 * 저장할 백엔드 API가 없어 이 브라우저에만 기억한다 (다른 방문자에게는 적용되지 않는다)
 */
export function AdminSettingsPage() {
  const isMockEnabled = useAppSettings((state) => state.isMockEnabled)
  const queryClient = useQueryClient()
  const titleId = useId()

  const handleToggle = () => {
    const next = !isMockEnabled
    appSettings.setMockEnabled(next)
    // 켜고 끈 뒤 화면이 바로 바뀐 데이터로 다시 불러오게 한다
    void queryClient.invalidateQueries()
    toast(next ? '시연 데이터를 켰어요' : '시연 데이터를 껐어요')
  }

  return (
    <div className="shop-look max-w-2xl space-y-6">
      <PageHeader
        title="설정"
        description="시연 데이터 사용 여부를 정해요. 이 브라우저에만 적용돼요."
      />
      <div className="border-rule rounded-lg border">
        <section
          aria-labelledby={titleId}
          className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-6"
        >
          <div className="min-w-0 flex-1 space-y-0.5">
            <h2 id={titleId} className="text-ink text-[15px] font-bold">
              시연 데이터
            </h2>
            <p className="text-ink-3 text-[13px]">
              쇼핑 목록에서 사진이 없는 상품에 예시 사진을 보여 줘요. 끄면 기본 이미지를 보여 줘요.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-4 self-end sm:self-auto">
            <span
              className={cn('text-sm font-semibold', isMockEnabled ? 'text-signal' : 'text-ink-3')}
            >
              {isMockEnabled ? '켜짐' : '꺼짐'}
            </span>
            <Button
              variant="outline"
              role="switch"
              aria-checked={isMockEnabled}
              aria-labelledby={titleId}
              className="max-lg:h-11"
              onClick={handleToggle}
            >
              {isMockEnabled ? '끄기' : '켜기'}
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}
