import { useSearchParams } from 'react-router'
import { cn } from '@/shared/lib'
import { PageHeader } from '@/shared/ui/PageHeader'
import { EventFailuresTab } from './EventFailuresTab'
import { OutboxTab } from './OutboxTab'
import { RecoveriesTab } from './RecoveriesTab'
import { StuckOrdersTab } from './StuckOrdersTab'

const TABS = [
  { value: 'stuck', label: '멈춘 주문' },
  { value: 'recoveries', label: '결제 반영 실패' },
  { value: 'event-failures', label: '이벤트 처리 실패' },
  { value: 'outbox', label: '격리된 이벤트' },
] as const
type Tab = (typeof TABS)[number]['value']

/** 주문 운영: 사람이 확인 · 조치해야 할 주문 문제만 모은다 (탭은 주소 ?tab=) */
export function AdminOrderOpsPage() {
  const [params, setParams] = useSearchParams()
  const tab: Tab = TABS.find((each) => each.value === params.get('tab'))?.value ?? 'stuck'
  return (
    <div className="shop-look space-y-5">
      <PageHeader
        title="주문 운영"
        description="사람이 확인하고 조치해야 할 주문 문제만 모았어요."
        note="GET /admin/orders/stuck(/summary) · /recoveries · /event-failures · /outbox/quarantined (BE #445 · #353 · #449 · #602, AI 진단 메모 #926)"
      />
      <div
        role="tablist"
        aria-label="주문 운영"
        className="border-rule flex gap-6 overflow-x-auto border-b"
      >
        {TABS.map((each) => (
          <button
            key={each.value}
            type="button"
            role="tab"
            aria-selected={tab === each.value}
            onClick={() => setParams(new URLSearchParams({ tab: each.value }), { replace: true })}
            className={cn(
              '-mb-px flex min-h-11 shrink-0 items-center border-b-2 text-[15px] font-bold transition-colors',
              tab === each.value
                ? 'border-ink text-ink'
                : 'text-ink-3 hover:text-ink border-transparent',
            )}
          >
            {each.label}
          </button>
        ))}
      </div>
      {tab === 'stuck' && <StuckOrdersTab />}
      {tab === 'recoveries' && <RecoveriesTab />}
      {tab === 'event-failures' && <EventFailuresTab />}
      {tab === 'outbox' && <OutboxTab />}
    </div>
  )
}
