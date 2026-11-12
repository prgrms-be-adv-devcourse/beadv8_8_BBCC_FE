import { Link, useSearchParams } from 'react-router'
import {
  aiConfidenceLabel,
  firstStuckKindWithCount,
  stuckKindLabel,
  useStuckOrdersQuery,
  useStuckSummaryQuery,
} from '@/entities/order-operation'
import { getErrorMessage } from '@/shared/api'
import { adminPathsOf } from '@/shared/config'
import { cn, formatDateTime, useArea } from '@/shared/lib'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Pagination } from '@/shared/ui/Pagination'
import { ListSkeleton } from '@/shared/ui/Skeleton'
import { StateMessage } from '@/shared/ui/StateMessage'

/** 주문 운영: 사람이 확인해야 할 멈춘 주문 (종류별 건수 → 목록 + AI 진단 메모). 조치는 주문 상세에서 사람이 한다 */
export function AdminOrderOpsPage() {
  const adminPaths = adminPathsOf(useArea())
  // 종류 · 페이지는 주소(?kind= · ?page=)에 둔다 → 주문 상세에서 돌아와도 그대로
  const [params, setParams] = useSearchParams()
  const summary = useStuckSummaryQuery()
  const kind = params.get('kind') ?? (summary.data ? firstStuckKindWithCount(summary.data) : null)
  const page = Math.max(0, Number(params.get('page') ?? 0) || 0)
  const stuck = useStuckOrdersQuery(kind, page)
  const select = (next: { kind: string; page?: number }) => {
    const search = new URLSearchParams({ kind: next.kind })
    if (next.page) search.set('page', String(next.page))
    setParams(search, { replace: true })
  }
  const total = summary.data?.reduce((sum, each) => sum + each.count, 0) ?? 0
  const rows = stuck.data?.content ?? []

  return (
    <div className="shop-look space-y-5">
      <PageHeader
        title="주문 운영"
        description="저절로 풀리지 않고 멈춘 주문이에요. AI 메모는 원인 추정일 뿐이니, 주문 상세에서 확인한 뒤 조치해요."
        note="GET /admin/orders/stuck/summary · /admin/orders/stuck?kind= (BE #445, AI 진단 메모 #926)"
      />
      {summary.isPending && <ListSkeleton rows={1} />}
      {summary.isError && (
        <StateMessage tone="error">{getErrorMessage(summary.error)}</StateMessage>
      )}
      {summary.data && (
        <section aria-label="멈춘 종류" className="space-y-2">
          <p className="text-ink-2 text-sm">
            {total === 0 ? '지금 멈춘 주문이 없어요.' : '건수가 있는 종류부터 확인해요.'}
          </p>
          <div role="group" aria-label="종류" className="flex flex-wrap gap-2">
            {summary.data.map((each) => (
              <button
                key={each.kind}
                type="button"
                aria-pressed={kind === each.kind}
                onClick={() => select({ kind: each.kind })}
                className={cn(
                  'border-rule inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm max-lg:h-11',
                  kind === each.kind ? 'border-ink text-ink font-semibold' : 'text-ink-2',
                  each.count === 0 && kind !== each.kind && 'opacity-60',
                )}
              >
                {stuckKindLabel(each.kind)}
                <span
                  className={cn(
                    'figure rounded-sm px-1.5 text-xs font-bold',
                    each.count > 0 ? 'bg-destructive/10 text-destructive' : 'bg-paper-2 text-ink-3',
                  )}
                >
                  {each.count}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {kind && (
        <section aria-label="멈춘 주문 목록" className="space-y-3">
          <h2 className="text-section">
            {stuckKindLabel(kind)}
            {stuck.data && (
              <span className="figure text-ink-3 ml-2 text-sm font-medium">
                {stuck.data.totalElements}건
              </span>
            )}
          </h2>
          {stuck.isPending && <ListSkeleton />}
          {stuck.isError && (
            <StateMessage tone="error">{getErrorMessage(stuck.error)}</StateMessage>
          )}
          {stuck.data && rows.length === 0 && (
            <p className="bg-paper-2 text-ink-2 rounded-lg py-12 text-center text-sm">
              이 종류로 멈춘 주문이 없어요.
            </p>
          )}
          <ul className="space-y-3">
            {rows.map((row) => (
              <li key={row.key} className="border-rule space-y-3 rounded-lg border p-4">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  {row.orderId ? (
                    <Link
                      to={adminPaths.order(row.orderId)}
                      className="font-semibold underline-offset-4 hover:underline"
                    >
                      주문 #{row.orderId}
                    </Link>
                  ) : (
                    <span className="font-semibold">주문 없음</span>
                  )}
                  <span className="text-ink-3">
                    {row.targetType}
                    {row.targetId && ` #${row.targetId}`} · {row.status}
                  </span>
                  <span className="text-ink-3 figure">{formatDateTime(row.since)}부터 멈춤</span>
                </div>
                {row.outbox && (
                  <p className="text-ink-2 text-[13px]">
                    {row.outbox.eventType} · 시도 {row.outbox.attemptCount}번 · 뒤에 밀린{' '}
                    {row.outbox.backlogCount}건
                    {row.outbox.lastError && ` · ${row.outbox.lastError}`}
                  </p>
                )}
                {row.aiMemo ? (
                  <div className="bg-paper-2 space-y-1 rounded-md p-3 text-sm">
                    <p className="text-ink-3 text-[12px] font-semibold">
                      AI 진단 메모 · {aiConfidenceLabel(row.aiMemo.confidence)} ·{' '}
                      {formatDateTime(row.aiMemo.createdAt)}
                    </p>
                    <p>
                      <span className="font-semibold">원인 추정</span> {row.aiMemo.summary}
                    </p>
                    <p>
                      <span className="font-semibold">권장 조치</span>{' '}
                      {row.aiMemo.recommendedAction}
                    </p>
                  </div>
                ) : (
                  <p className="text-ink-3 text-[13px]">AI 진단 메모가 아직 없어요.</p>
                )}
              </li>
            ))}
          </ul>
          {stuck.data && (
            <Pagination
              page={stuck.data.page}
              totalPages={stuck.data.totalPages}
              onChange={(next) => select({ kind, page: next })}
            />
          )}
        </section>
      )}
    </div>
  )
}
