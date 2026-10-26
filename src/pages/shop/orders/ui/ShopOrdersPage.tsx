import { Link, useSearchParams } from 'react-router'
import {
  countOrdersByTab,
  filterOrdersByTab,
  ORDER_TABS,
  orderTabOf,
  OrderStatusBadge,
  useOrdersQuery,
  type OrderTab,
} from '@/entities/order'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { cn, formatDateTime, formatWon } from '@/shared/lib'
import { ListSkeleton } from '@/shared/ui/Skeleton'
import { StateMessage } from '@/shared/ui/StateMessage'

/** 내 주문 (기획서 F08): 상태 탭 → 주문 카드 → 주문 상세 */
export function ShopOrdersPage() {
  const orders = useOrdersQuery()
  // 탭은 주소(?tab=)에 둔다 → 마이페이지 요약에서 바로 열고, 상세에서 뒤로 와도 그대로
  const [params, setParams] = useSearchParams()
  const tab = orderTabOf(params.get('tab'))
  const setTab = (next: OrderTab) =>
    setParams(next === 'ALL' ? {} : { tab: next }, { replace: true })
  const all = orders.data?.content ?? []
  const counts = countOrdersByTab(all)
  const visible = filterOrdersByTab(all, tab)

  return (
    <div className="shop-look space-y-6">
      <h1 className="text-page">주문 내역</h1>
      <div
        role="tablist"
        aria-label="주문 상태"
        className="border-rule flex gap-6 overflow-x-auto border-b"
      >
        {ORDER_TABS.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={tab === item.value}
            onClick={() => setTab(item.value)}
            className={cn(
              '-mb-px flex min-h-11 shrink-0 items-center gap-1.5 border-b-2 text-[15px] font-bold transition-colors',
              tab === item.value
                ? 'border-ink text-ink'
                : 'text-ink-3 hover:text-ink border-transparent',
            )}
          >
            {item.label} <span className="figure text-sm">{counts[item.value]}</span>
          </button>
        ))}
      </div>
      {orders.isPending && <ListSkeleton />}
      {orders.isError && <StateMessage tone="error">{getErrorMessage(orders.error)}</StateMessage>}
      {orders.data && visible.length === 0 && (
        <div className="bg-paper-2 rounded-card space-y-3 py-16 text-center">
          <p className="text-ink-2 text-base">
            {tab === 'ALL' ? '주문한 상품이 없어요.' : '이 상태의 주문이 없어요.'}
          </p>
          {tab === 'ALL' && (
            <Link to={paths.shop.home} className="shop-link">
              상품 보러 가기
            </Link>
          )}
        </div>
      )}
      {visible.length > 0 && (
        <ul className="divide-rule border-rule divide-y border-b">
          {visible.map((order) => (
            <li key={order.id}>
              <Link
                to={paths.shop.order(order.id)}
                className="hover:bg-paper-2 -mx-4 grid gap-x-6 gap-y-2 px-4 py-5 transition-colors md:grid-cols-[minmax(0,1fr)_auto_auto_auto] md:items-center"
              >
                <div className="min-w-0 space-y-1">
                  <p className="text-ink-3 flex flex-wrap gap-x-3 text-[13px]">
                    <span>{formatDateTime(order.orderedAt)}</span>
                    <span>주문번호 {order.id}</span>
                  </p>
                  <p className="text-[15px] font-semibold">
                    {order.title ?? `주문번호 ${order.id}`}
                  </p>
                </div>
                <span className="figure font-bold">{formatWon(order.totalAmount)}</span>
                <OrderStatusBadge status={order.status} />
                <span className="text-ink-3 text-[13px] font-semibold">상세</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
