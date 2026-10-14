import { Link } from 'react-router'
import { OrderStatusBadge, useOrdersQuery } from '@/entities/order'
import { getErrorMessage } from '@/shared/api'
import { formatDateTime, formatWon } from '@/shared/lib'
import { Card } from '@/shared/ui/card'
import { PageHeader, StateMessage } from '@/shared/ui/page-header'

export function OrdersPage() {
  const orders = useOrdersQuery()

  return (
    <div className="space-y-4">
      <PageHeader title="⑥ 내 주문" description="주문 상세에서 배송 완료된 상품을 구매확정해요." />
      {orders.isPending && <StateMessage>불러오는 중…</StateMessage>}
      {orders.isError && <StateMessage tone="error">{getErrorMessage(orders.error)}</StateMessage>}
      {orders.data?.content.length === 0 && <StateMessage>주문이 없어요.</StateMessage>}
      {orders.data?.content.map((order) => (
        <Link key={order.id} to={`/orders/${order.id}`}>
          <Card className="hover:border-primary mb-2 flex items-center justify-between transition-colors">
            <div>
              <p className="font-medium">주문 #{order.id}</p>
              <p className="text-muted-foreground text-sm">{formatDateTime(order.orderedAt)}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold">{formatWon(order.totalAmount)}</span>
              <OrderStatusBadge status={order.status} />
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
}
