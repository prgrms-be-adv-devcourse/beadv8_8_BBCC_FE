import { endpointOf, isMockActive, useMockSettings } from '@/shared/api'
import { cn } from '@/shared/lib'

type MockBadgeProps = {
  /** "GET /admin/orders"처럼 메서드 + 목 경로 (mock-endpoints와 같은 글자). 하나라도 목이면 보인다 */
  endpoints: string[]
  className?: string
}

/**
 * 목 데이터로 응답하는 영역 표시. 엔드포인트가 'real'로 바뀌거나 흐름 패널에서 도메인을 끄면 저절로 사라진다
 */
export function MockBadge({ endpoints, className }: MockBadgeProps) {
  const enabled = useMockSettings((state) => state.enabled)
  const active = endpoints.flatMap((endpoint) => {
    const [method, path] = endpoint.split(' ')
    return isMockActive(method, path, enabled) ? [endpointOf(method, path)] : []
  })
  if (active.length === 0) return null
  return (
    <span
      title={`목 응답: ${active.map((item) => `${item?.method} ${item?.path} (${item?.backend})`).join(', ')}`}
      className={cn(
        'border-muted-foreground/40 text-muted-foreground ml-1.5 inline-flex shrink-0 items-center rounded border border-dashed px-1.5 py-px align-middle text-[10px] font-medium whitespace-nowrap',
        className,
      )}
    >
      준비 중(목)
    </span>
  )
}
