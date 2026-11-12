import { useState } from 'react'
import { RunSettlementButton } from '@/features/run-settlement'
import {
  SETTLEMENT_STATUS_LABEL,
  useAdminSettlementsQuery,
  type SettlementStatus,
} from '@/entities/settlement'
import { getErrorMessage } from '@/shared/api'
import { cn } from '@/shared/lib'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Pagination } from '@/shared/ui/Pagination'
import { ListSkeleton } from '@/shared/ui/Skeleton'
import { StateMessage } from '@/shared/ui/StateMessage'
import { AdminSettlementTable } from './AdminSettlementTable'
import { SettlementRunLookup } from './SettlementRunLookup'

const STATUSES = Object.keys(SETTLEMENT_STATUS_LABEL) as SettlementStatus[]

export function AdminSettlementsPage() {
  const [status, setStatus] = useState<SettlementStatus | null>(null)
  const [page, setPage] = useState(0)
  const settlements = useAdminSettlementsQuery(status, page)
  const rows = settlements.data?.content ?? []
  const selectStatus = (next: SettlementStatus | null) => {
    setStatus(next)
    setPage(0)
  }

  return (
    <div className="shop-look max-w-4xl space-y-8">
      <PageHeader
        title="정산"
        step="⑦"
        description="영업일 오전 10시에 자동으로 정산해요. 필요하면 바로 실행하고, 지급 결과를 받지 못한 정산서는 다시 요청해요."
        note="k3s CronJob이 매일 오전 10시에 돌고, 영업일이면 전날까지 구매확정분을 정산해요. 시연에서는 수동으로 실행해요. 정산이 끝나면 결제 도메인이 판매자 예치금에 입금해요."
      />
      <section aria-label="정산 실행" className="max-w-2xl space-y-3">
        <h2 className="text-section">정산 실행</h2>
        <RunSettlementButton />
      </section>
      <section aria-label="실행 조회" className="max-w-2xl space-y-3">
        <h2 className="text-section">실행 조회</h2>
        <SettlementRunLookup />
      </section>
      <section aria-label="정산서 목록" className="space-y-3">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <h2 className="text-section mr-auto">
            정산서
            {settlements.data && (
              <span className="figure text-ink-3 ml-2 text-sm font-medium">
                {settlements.data.totalElements}건
              </span>
            )}
          </h2>
          <div role="group" aria-label="상태" className="flex gap-2">
            {[null, ...STATUSES].map((key) => (
              <button
                key={key ?? 'ALL'}
                type="button"
                aria-pressed={status === key}
                onClick={() => selectStatus(key)}
                className={cn(
                  'border-rule inline-flex h-10 shrink-0 items-center rounded-md border px-4 text-sm font-semibold transition-colors max-lg:h-11',
                  status === key ? 'border-ink text-ink' : 'text-ink-2 hover:border-field-edge',
                )}
              >
                {key ? SETTLEMENT_STATUS_LABEL[key] : '전체'}
              </button>
            ))}
          </div>
        </div>
        {settlements.isPending && <ListSkeleton />}
        {settlements.isError && (
          <StateMessage tone="error">{getErrorMessage(settlements.error)}</StateMessage>
        )}
        {settlements.data && rows.length === 0 && (
          <p className="bg-paper-2 text-ink-2 rounded-lg py-12 text-center text-sm">
            정산서가 없어요.
          </p>
        )}
        {rows.length > 0 && <AdminSettlementTable settlements={rows} />}
        {settlements.data && (
          <Pagination
            page={settlements.data.page}
            totalPages={settlements.data.totalPages}
            onChange={setPage}
          />
        )}
      </section>
    </div>
  )
}
