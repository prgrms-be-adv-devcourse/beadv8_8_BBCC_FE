import { RateLimitForm, RateLimitSwitch } from '@/features/change-rate-limit'
import { useRateLimitSettingsQuery, type RateLimit } from '@/entities/rate-limit'
import { getErrorMessage } from '@/shared/api'
import { PageHeader } from '@/shared/ui/PageHeader'
import { ListSkeleton } from '@/shared/ui/Skeleton'
import { StateMessage } from '@/shared/ui/StateMessage'

// 서버 값이 바뀌면(저장 응답) 입력 칸을 새 값으로 다시 채운다
const keyOf = (limit: RateLimit) => `${limit.capacity}:${limit.periodMs}`

/** 요청 수 제한: Gateway가 받는 요청 수를 켜고 끄고, 사용자별 · 전체 한도를 바꾼다 (BE #1421) */
export function AdminRateLimitPage() {
  const settings = useRateLimitSettingsQuery()

  return (
    <div className="shop-look max-w-2xl space-y-6">
      <PageHeader
        title="요청 수 제한"
        description="요청이 몰릴 때 서버를 보호해요. 바꾼 값은 2초 안에 적용되고, 서버를 다시 배포해도 유지돼요. 검색 · 챗봇 한도는 여기서 바꿀 수 없어요."
      />
      {settings.isPending && <ListSkeleton />}
      {settings.isError && (
        <StateMessage tone="error">{getErrorMessage(settings.error)}</StateMessage>
      )}
      {settings.data && (
        <div className="border-rule divide-rule divide-y rounded-lg border">
          <RateLimitSwitch isEnabled={settings.data.isEnabled} />
          <RateLimitForm
            key={`client-${keyOf(settings.data.client)}`}
            target="client"
            limit={settings.data.client}
          />
          <RateLimitForm
            key={`total-${keyOf(settings.data.total)}`}
            target="total"
            limit={settings.data.total}
          />
        </div>
      )}
    </div>
  )
}
