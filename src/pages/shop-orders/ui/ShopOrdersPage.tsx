import { Link } from 'react-router'
import { OrderStatusBadge, useOrdersQuery } from '@/entities/order'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { formatDateTime, formatWon } from '@/shared/lib'
import { Card } from '@/shared/ui/card'
import { StateMessage } from '@/shared/ui/page-header'

export function ShopOrdersPage() {
  const orders = useOrdersQuery()

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">주문 내역</h1>
      {orders.isPending && <StateMessage>불러오는 중…</StateMessage>}
      {orders.isError && <StateMessage tone="error">{getErrorMessage(orders.error)}</StateMessage>}
      {orders.data?.content.length === 0 && (
        <Card className="py-10 text-center">
          <p className="text-muted-foreground">주문한 상품이 없어요.</p>
        </Card>
      )}
      {orders.data?.content.map((order) => (
        <Link key={order.id} to={paths.shop.order(order.id)} className="block">
          <Card className="hover:border-primary flex items-center justify-between transition-colors">
            <div>
              <p className="text-muted-foreground text-sm">{formatDateTime(order.orderedAt)}</p>
              <p className="font-semibold">주문번호 {order.id}</p>
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
