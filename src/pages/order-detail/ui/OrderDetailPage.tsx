import { Link, useParams } from 'react-router'
import {
  buildOrderTimeline,
  canConfirmItem,
  deliveryOf,
  needsCharge,
  OrderDeliveryList,
  OrderItemRow,
  OrderStatusBanner,
  OrderTimeline,
  useOrderQuery,
} from '@/entities/order'
import { ConfirmPurchaseButton } from '@/features/confirm-purchase'
import { getErrorMessage } from '@/shared/api'
import { formatDateTime, formatWon } from '@/shared/lib'
import { Card, CardTitle } from '@/shared/ui/card'
import { PageHeader, StateMessage } from '@/shared/ui/page-header'

export function OrderDetailPage() {
  const { orderId = '' } = useParams()
  const query = useOrderQuery(orderId)

  if (query.isPending) return <StateMessage>불러오는 중…</StateMessage>
  if (query.isError) return <StateMessage tone="error">{getErrorMessage(query.error)}</StateMessage>

  const order = query.data
  return (
    <div className="space-y-4">
      <PageHeader
        title={`주문 #${order.id}`}
        description={`${formatDateTime(order.orderedAt)} 주문`}
      />
      <OrderStatusBanner
        order={order}
        polling={query.isFetching}
        cancelAction={
          needsCharge(order) && (
            <Link to="/wallet" className="text-primary text-sm underline">
              예치금 충전하러 가기
            </Link>
          )
        }
      />

      <Card>
        <CardTitle className="mb-2">진행 (상태 변화)</CardTitle>
        <OrderTimeline events={buildOrderTimeline(order)} />
      </Card>

      <Card className="space-y-2">
        <CardTitle>주문상품</CardTitle>
        {order.items.map((item) => (
          <OrderItemRow
            key={item.id}
            item={item}
            delivery={deliveryOf(order, item)}
            action={
              canConfirmItem(item) && (
                <ConfirmPurchaseButton orderId={order.id} orderItemId={item.id} />
              )
            }
          />
        ))}
        <div className="flex justify-between border-t pt-2 font-semibold">
          <span>합계</span>
          <span>{formatWon(order.totalAmount)}</span>
        </div>
      </Card>

      <Card className="space-y-2">
        <CardTitle>판매자별 배송</CardTitle>
        <OrderDeliveryList order={order} />
      </Card>
    </div>
  )
}
