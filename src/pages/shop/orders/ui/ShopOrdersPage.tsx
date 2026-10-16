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
import { Card } from '@/shared/ui/card'
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
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">주문 내역</h1>
      <div role="tablist" aria-label="주문 상태" className="flex gap-2 overflow-x-auto">
        {ORDER_TABS.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={tab === item.value}
            onClick={() => setTab(item.value)}
            className={cn(
              'shrink-0 rounded-full border px-3 py-1 text-sm',
              tab === item.value
                ? 'border-primary bg-primary text-primary-foreground'
                : 'hover:border-primary bg-white',
            )}
          >
            {item.label} {counts[item.value]}
          </button>
        ))}
      </div>
      {orders.isPending && <ListSkeleton />}
      {orders.isError && <StateMessage tone="error">{getErrorMessage(orders.error)}</StateMessage>}
      {orders.data && visible.length === 0 && (
        <Card className="py-10 text-center">
          <p className="text-muted-foreground">
            {tab === 'ALL' ? '주문한 상품이 없어요.' : '이 상태의 주문이 없어요.'}
          </p>
          {tab === 'ALL' && (
            <Link to={paths.shop.home} className="text-primary mt-2 inline-block underline">
              상품 보러 가기
            </Link>
          )}
        </Card>
      )}
      {visible.map((order) => (
        <Link key={order.id} to={paths.shop.order(order.id)} className="block">
          <Card className="hover:border-primary flex flex-wrap items-center justify-between gap-3 transition-colors">
            <div>
              <p className="text-muted-foreground text-sm">
                {formatDateTime(order.orderedAt)} · 주문번호 {order.id}
              </p>
              <p className="font-semibold">{order.title ?? `주문번호 ${order.id}`}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold">{formatWon(order.totalAmount)}</span>
              <OrderStatusBadge status={order.status} />
              <span className="text-muted-foreground text-sm">상세 ›</span>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
}
