import { useSearchParams } from 'react-router'
import {
  CANCEL_REASON_LABEL,
  ORDER_STATUS_LABEL,
  useAdminOrdersQuery,
  type AdminOrder,
  type OrderStatus,
} from '@/entities/order'
import { getErrorMessage } from '@/shared/api'
import { adminPathsOf } from '@/shared/config'
import { cn, downloadCsv, formatDateTime, toCsv, useArea, type CsvColumn } from '@/shared/lib'
import { PageHeader } from '@/shared/ui/PageHeader'
import { ListSkeleton } from '@/shared/ui/Skeleton'
import { StateMessage } from '@/shared/ui/StateMessage'
import { AdminOrderTable } from './AdminOrderTable'

const STATUSES = Object.keys(ORDER_STATUS_LABEL) as OrderStatus[]
const TABS: { value: OrderStatus | null; label: string }[] = [
  { value: null, label: '전체' },
  ...STATUSES.map((status) => ({ value: status, label: ORDER_STATUS_LABEL[status] })),
]

const CSV_COLUMNS: CsvColumn<AdminOrder>[] = [
  { header: '주문', value: (o) => o.id },
  { header: '회원', value: (o) => o.memberId },
  { header: '주문 일시', value: (o) => formatDateTime(o.orderedAt) },
  { header: '상품 수', value: (o) => o.itemCount },
  { header: '금액', value: (o) => o.totalAmount },
  { header: '상태', value: (o) => ORDER_STATUS_LABEL[o.status] },
  {
    header: '취소 사유',
    value: (o) => (o.cancelReason ? CANCEL_REASON_LABEL[o.cancelReason] : ''),
  },
]

/** 관리자 전체 주문 (기획서 8장 보완): 상태 탭(주소 ?status=) → 주문 표 → 주문을 누르면 주문 상세 */
export function AdminOrdersPage() {
  const adminPaths = adminPathsOf(useArea())
  // 상태 탭은 주소(?status=)에 둔다 → 대시보드에서 바로 열린다
  const [params, setParams] = useSearchParams()
  const raw = params.get('status')
  const status = STATUSES.includes(raw as OrderStatus) ? (raw as OrderStatus) : null
  // BE는 상태로 거르지 않는다: 같은 목록(최근 100건)을 한 번 받아 탭 건수와 표를 만든다
  const all = useAdminOrdersQuery(null)
  const visible = useAdminOrdersQuery(status)
  const orders = visible.data?.content ?? []
  const countOf = (value: OrderStatus | null) =>
    all.data?.content.filter((order) => value === null || order.status === value).length

  return (
    <div className="shop-look space-y-5">
      <PageHeader
        mockEndpoints={['GET /admin/orders']}
        title="전체 주문"
        description="모든 회원의 주문을 상태별로 봐요. 주문을 누르면 결제까지 이어서 봐요."
        note="GET /admin/orders (BE #323). 최근 100건 안에서 화면이 상태로 거른다."
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
            {tab.label} <span className="figure text-sm">{countOf(tab.value)}</span>
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
            <span className="figure">{orders.length}건</span>
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
    </div>
  )
}
