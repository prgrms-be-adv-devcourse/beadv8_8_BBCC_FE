import { useSearchParams } from 'react-router'
import {
  CANCEL_REASON_LABEL,
  ORDER_STATUS_LABEL,
  useAdminOrdersQuery,
  useAdminOrderTabCountsQuery,
  type AdminOrder,
  type OrderStatus,
} from '@/entities/order'
import { getErrorMessage, pageFromSearch } from '@/shared/api'
import { adminPathsOf } from '@/shared/config'
import {
  cn,
  downloadCsv,
  formatDateTime,
  labelOf,
  toCsv,
  useArea,
  type CsvColumn,
} from '@/shared/lib'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Pagination } from '@/shared/ui/Pagination'
import { ListSkeleton } from '@/shared/ui/Skeleton'
import { StateMessage } from '@/shared/ui/StateMessage'
import { AdminOrderTable } from './AdminOrderTable'

const STATUSES = Object.keys(ORDER_STATUS_LABEL) as OrderStatus[]
const TABS: { value: OrderStatus | null; label: string }[] = [
  { value: null, label: '전체' },
  ...STATUSES.map((status) => ({ value: status, label: labelOf(ORDER_STATUS_LABEL, status) })),
]
const PAGE_SIZE = 20

const CSV_COLUMNS: CsvColumn<AdminOrder>[] = [
  { header: '주문', value: (o) => o.id },
  { header: '회원', value: (o) => o.memberId },
  { header: '주문 일시', value: (o) => formatDateTime(o.orderedAt) },
  { header: '상품 수', value: (o) => o.itemCount },
  { header: '금액', value: (o) => o.totalAmount },
  { header: '상태', value: (o) => labelOf(ORDER_STATUS_LABEL, o.status) },
  {
    header: '취소 사유',
    value: (o) => labelOf(CANCEL_REASON_LABEL, o.cancelReason),
  },
  { header: '취소 시각', value: (o) => (o.cancelledAt ? formatDateTime(o.cancelledAt) : '') },
]

/** 관리자 전체 주문 (기획서 8장 보완): 상태 탭(주소 ?status=) · 페이지(?page=) → 주문 표 → 주문을 누르면 주문 상세 */
export function AdminOrdersPage() {
  const adminPaths = adminPathsOf(useArea())
  // 상태 탭은 주소(?status=)에 둔다 → 대시보드에서 바로 열린다
  const [params, setParams] = useSearchParams()
  const raw = params.get('status')
  const status = STATUSES.includes(raw as OrderStatus) ? (raw as OrderStatus) : null
  const page = pageFromSearch(params.get('page'))
  // 탭은 서버가 거른다 (BE #1280). 탭 건수는 탭마다 size 1 요청의 전체 건수
  const visible = useAdminOrdersQuery(status, page, PAGE_SIZE)
  const counts = useAdminOrderTabCountsQuery()
  const orders = visible.data?.content ?? []
  const countOf = (value: OrderStatus | null) => counts[value ?? 'ALL']
  const setPage = (next: number) => {
    const search = new URLSearchParams(params)
    if (next > 0) search.set('page', String(next))
    else search.delete('page')
    setParams(search, { replace: true })
  }

  return (
    <div className="shop-look space-y-5">
      <PageHeader
        title="전체 주문"
        description="모든 회원의 주문을 상태별로 봐요. 주문을 누르면 결제까지 이어서 봐요."
        note="GET /admin/orders?status= (BE #323 · #1280). 상태는 서버가 거르고, 탭 건수는 size 1 요청의 전체 건수."
      />
      <div
        role="tablist"
        aria-label="주문 상태"
        className="border-rule flex gap-6 overflow-x-auto border-b"
      >
        {TABS.map((tab) => (
          <button
            key={tab.label}
            type="button"
            role="tab"
            aria-selected={status === tab.value}
            onClick={() => setParams(tab.value ? { status: tab.value } : {}, { replace: true })}
            className={cn(
              '-mb-px flex min-h-11 shrink-0 items-center gap-1.5 border-b-2 text-[15px] font-bold transition-colors',
              status === tab.value
                ? 'border-ink text-ink'
                : 'text-ink-3 hover:text-ink active:text-ink border-transparent',
            )}
          >
            {tab.label} <span className="figure text-sm">{countOf(tab.value) ?? '…'}</span>
          </button>
        ))}
      </div>
      {visible.isPending && <ListSkeleton />}
      {visible.isError && (
        <StateMessage tone="error">{getErrorMessage(visible.error)}</StateMessage>
      )}
      {visible.data && (
        <section aria-label="주문 목록" className="space-y-2">
          <div className="text-ink-3 flex min-h-11 items-center justify-between text-[13px]">
            <span className="figure">{visible.data.totalElements}건</span>
            {orders.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  downloadCsv(`kidly-orders-${status ?? 'all'}`, toCsv(orders, CSV_COLUMNS))
                }
                className="text-ink-2 hover:text-ink inline-flex min-h-11 items-center font-semibold underline underline-offset-4 transition-colors lg:min-h-8"
              >
                CSV 내려받기
              </button>
            )}
          </div>
          {orders.length === 0 ? (
            <p className="bg-paper-2 text-ink-2 rounded-lg py-12 text-center text-sm">
              {status === null ? '주문이 없어요.' : '이 상태의 주문이 없어요.'}
            </p>
          ) : (
            <AdminOrderTable
              orders={orders}
              orderHref={adminPaths.order}
              memberHref={adminPaths.member}
              listSearch={params.toString()}
            />
          )}
        </section>
      )}
      {visible.data && (
        <Pagination
          page={visible.data.page}
          totalPages={visible.data.totalPages}
          onChange={setPage}
        />
      )}
    </div>
  )
}
