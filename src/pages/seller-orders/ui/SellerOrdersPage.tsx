import { carrierName, DELIVERY_STATUS_LABEL } from '@/entities/order'
import { useSellerOrdersQuery } from '@/entities/seller-order'
import { ShipOrderControls } from '@/features/ship-order'
import { getErrorMessage } from '@/shared/api'
import { formatDateTime, formatWon } from '@/shared/lib'
import { Badge } from '@/shared/ui/badge'
import { Card } from '@/shared/ui/card'
import { PageHeader, StateMessage } from '@/shared/ui/page-header'

export function SellerOrdersPage() {
  const orders = useSellerOrdersQuery()

  return (
    <div className="space-y-4">
      <PageHeader
        title="⑤ 판매 주문 (판매자)"
        description="결제 완료된 주문 중 내 몫만 보여요. 송장을 넣어 발송하고 배송 완료로 바꿔요."
      />
      {orders.isPending && <StateMessage>불러오는 중…</StateMessage>}
      {orders.isError && <StateMessage tone="error">{getErrorMessage(orders.error)}</StateMessage>}
      {orders.data?.content.length === 0 && <StateMessage>판매 주문이 없어요.</StateMessage>}
      {orders.data?.content.map((order) => (
        <Card key={order.sellerOrderId} className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-medium">
              판매 주문 #{order.sellerOrderId}{' '}
              <span className="text-muted-foreground text-sm">(주문 #{order.orderId})</span>
            </p>
            <Badge>{DELIVERY_STATUS_LABEL[order.status]}</Badge>
          </div>
          <ul className="text-sm">
            {order.items.map((item) => (
              <li key={item.orderItemId}>
                {item.productName} · {item.size} × {item.quantity} = {formatWon(item.amount)}
                {item.child && ` · ${item.child.name}(${item.child.heightCm}cm)`}
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground text-xs">
            {formatDateTime(order.orderedAt)} 주문 · 받는 분 {order.shippingAddress.recipientName} ·{' '}
            {order.shippingAddress.address}
            {order.trackingNumber && ` · ${carrierName(order.carrier)} ${order.trackingNumber}`}
          </p>
          <ShipOrderControls sellerOrder={order} />
        </Card>
      ))}
    </div>
  )
}
