import { SellerOrderCard, useSellerOrdersQuery } from '@/entities/seller-order'
import { ShipOrderControls } from '@/features/ship-order'
import { getErrorMessage } from '@/shared/api'
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
        <SellerOrderCard
          key={order.id}
          order={order}
          action={<ShipOrderControls sellerOrder={order} />}
        />
      ))}
    </div>
  )
}
