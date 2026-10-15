import { useState } from 'react'
import {
  CANCEL_REASON_LABEL,
  ORDER_STATUS_LABEL,
  OrderStatusBadge,
  useAdminOrdersQuery,
  type OrderStatus,
} from '@/entities/order'
import { getErrorMessage } from '@/shared/api'
import { formatDateTime, formatWon } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StateMessage } from '@/shared/ui/StateMessage'

/** 관리자 전체 주문 조회 (기획서 8장 보완 · 목) */
export function AdminOrdersPage() {
  const [status, setStatus] = useState<OrderStatus | null>(null)
  const orders = useAdminOrdersQuery(status)

  return (
    <div className="space-y-4">
      <PageHeader
        mockEndpoints={['GET /admin/orders']}
        title="전체 주문"
        description="모든 회원의 주문을 상태별로 봐요."
        note="GET /admin/orders는 백엔드에 없어 목이에요. 이 탭에서 각 회원이 받은 주문 응답으로 만들어요."
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={status === null ? 'default' : 'outline'}
          onClick={() => setStatus(null)}
        >
          전체
        </Button>
        {(Object.keys(ORDER_STATUS_LABEL) as OrderStatus[]).map((key) => (
          <Button
            key={key}
            size="sm"
            variant={status === key ? 'default' : 'outline'}
            onClick={() => setStatus(key)}
          >
            {ORDER_STATUS_LABEL[key]}
          </Button>
        ))}
      </div>
      {orders.isPending && <StateMessage>불러오는 중…</StateMessage>}
      {orders.isError && <StateMessage tone="error">{getErrorMessage(orders.error)}</StateMessage>}
      {orders.data?.content.length === 0 && <StateMessage>주문이 없어요.</StateMessage>}
      {orders.data?.content.map((order) => (
        <Card key={order.id} className="flex flex-wrap items-center gap-3 text-sm">
          <span className="font-medium">주문 {order.id}</span>
          <span className="text-muted-foreground">회원 {order.memberId}</span>
          <span className="text-muted-foreground">상품 {order.itemCount}개</span>
          <span className="text-muted-foreground">{formatDateTime(order.orderedAt)}</span>
          <span className="ml-auto font-semibold">{formatWon(order.totalAmount)}</span>
          <OrderStatusBadge status={order.status} />
          {order.cancelReason && (
            <span className="text-destructive w-full text-xs">
              {CANCEL_REASON_LABEL[order.cancelReason]}
            </span>
          )}
        </Card>
      ))}
    </div>
  )
}
