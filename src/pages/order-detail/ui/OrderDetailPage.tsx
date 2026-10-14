import { Link, useParams } from 'react-router'
import {
  CANCEL_REASON_LABEL,
  carrierName,
  DELIVERY_STATUS_LABEL,
  ITEM_STATUS_LABEL,
  ORDER_STATUS_LABEL,
  useOrderQuery,
  type OrderDetail,
} from '@/entities/order'
import { ConfirmPurchaseButton } from '@/features/confirm-purchase'
import { getErrorMessage } from '@/shared/api'
import { formatDateTime, formatWon } from '@/shared/lib'
import { Badge } from '@/shared/ui/badge'
import { Card, CardTitle } from '@/shared/ui/card'
import { PageHeader, StateMessage } from '@/shared/ui/page-header'

export function OrderDetailPage() {
  const { orderId = '' } = useParams()
  const order = useOrderQuery(orderId)

  if (order.isPending) return <StateMessage>불러오는 중…</StateMessage>
  if (order.isError) return <StateMessage tone="error">{getErrorMessage(order.error)}</StateMessage>

  const detail = order.data
  return (
    <div className="space-y-4">
      <PageHeader
        title={`주문 #${detail.orderId}`}
        description={`${formatDateTime(detail.orderedAt)} 주문`}
      />
      <StatusBanner
        detail={detail}
        polling={order.isFetching && detail.status === 'PENDING_PAYMENT'}
      />

      <Card>
        <CardTitle className="mb-2">진행 (상태 변화)</CardTitle>
        <Timeline detail={detail} />
      </Card>

      <Card className="space-y-2">
        <CardTitle>주문상품</CardTitle>
        {detail.items.map((item) => {
          const delivery = detail.deliveries.find((d) => d.sellerId === item.sellerId)
          const canConfirm = item.status === 'ORDERED' && item.deliveredAt !== null
          return (
            <div
              key={item.orderItemId}
              className="flex items-center justify-between border-t pt-2 text-sm"
            >
              <div>
                <p className="font-medium">
                  {item.productName} · {item.size} × {item.quantity}{' '}
                  <Badge variant={item.status === 'CONFIRMED' ? 'success' : 'muted'}>
                    {ITEM_STATUS_LABEL[item.status]}
                    {item.confirmType === 'AUTO' && ' (자동)'}
                  </Badge>
                </p>
                <p className="text-muted-foreground">
                  {formatWon(item.unitPrice)} × {item.quantity} = {formatWon(item.amount)}
                  {item.child &&
                    ` · 입을 자녀 ${item.child.name} (주문 당시 ${item.child.heightCm}cm · ${item.child.weightKg}kg)`}
                  {delivery && ` · 배송 ${DELIVERY_STATUS_LABEL[delivery.status]}`}
                </p>
              </div>
              {canConfirm && (
                <ConfirmPurchaseButton orderId={detail.orderId} orderItemId={item.orderItemId} />
              )}
            </div>
          )
        })}
        <div className="flex justify-between border-t pt-2 font-semibold">
          <span>합계</span>
          <span>{formatWon(detail.totalAmount)}</span>
        </div>
      </Card>

      <Card className="space-y-2">
        <CardTitle>판매자별 배송</CardTitle>
        {detail.deliveries.length === 0 && (
          <StateMessage>결제가 끝나면 판매자별 배송이 만들어져요.</StateMessage>
        )}
        {detail.deliveries.map((delivery) => (
          <div key={delivery.sellerOrderId} className="flex justify-between border-t pt-2 text-sm">
            <span>
              판매자 {delivery.sellerId} · 판매 주문 #{delivery.sellerOrderId}
            </span>
            <span>
              <Badge>{DELIVERY_STATUS_LABEL[delivery.status]}</Badge>{' '}
              {delivery.trackingNumber &&
                `${carrierName(delivery.carrier)} ${delivery.trackingNumber}`}
            </span>
          </div>
        ))}
        <p className="text-muted-foreground text-xs">
          받는 분 {detail.shippingAddress.recipientName} · {detail.shippingAddress.address}
        </p>
      </Card>
    </div>
  )
}

function StatusBanner({ detail, polling }: { detail: OrderDetail; polling: boolean }) {
  if (detail.status === 'PENDING_PAYMENT') {
    return (
      <Card className="border-primary">
        <p className="font-semibold">결제 처리 중… {polling && '(1초마다 다시 조회)'}</p>
        <p className="text-muted-foreground text-sm">
          주문하기는 주문을 결제대기로 저장하고 끝나요. 서버가 이벤트로 재고 차감 → 예치금 결제를
          이어서 해요.
        </p>
      </Card>
    )
  }
  if (detail.status === 'CANCELLED') {
    return (
      <Card className="border-destructive">
        <p className="text-destructive font-semibold">{ORDER_STATUS_LABEL.CANCELLED}</p>
        <p className="text-sm">
          {detail.cancelReason ? CANCEL_REASON_LABEL[detail.cancelReason] : '주문이 취소됐어요.'}{' '}
          재고는 복구되고 예치금은 차감되지 않았어요.
        </p>
        {detail.cancelReason === 'PAYMENT_FAILED' && (
          <Link to="/wallet" className="text-primary text-sm underline">
            예치금 충전하러 가기
          </Link>
        )}
      </Card>
    )
  }
  return (
    <Card className="border-green-600">
      <p className="font-semibold text-green-700">{ORDER_STATUS_LABEL.PAID}</p>
      <p className="text-muted-foreground text-sm">
        재고가 차감되고 예치금에서 {formatWon(detail.totalAmount)}이 결제됐어요.
      </p>
    </Card>
  )
}

function Timeline({ detail }: { detail: OrderDetail }) {
  const events: { at: string | null; label: string; note?: string }[] = [
    {
      at: detail.orderedAt,
      label: '주문 저장 (결제대기)',
      note: 'order.created → 상품이 재고 차감',
    },
  ]
  if (detail.status === 'PAID') {
    events.push({
      at: null,
      label: '결제 완료',
      note: 'stock.deducted → order.payment-requested → payment.completed',
    })
  }
  if (detail.status === 'CANCELLED') {
    events.push({
      at: null,
      label: '주문 취소',
      note: detail.cancelReason ? CANCEL_REASON_LABEL[detail.cancelReason] : undefined,
    })
  }
  for (const delivery of detail.deliveries) {
    if (delivery.shippedAt) {
      events.push({
        at: delivery.shippedAt,
        label: `판매자 ${delivery.sellerId} 발송`,
        note: `${carrierName(delivery.carrier)} ${delivery.trackingNumber}`,
      })
    }
    if (delivery.deliveredAt) {
      events.push({ at: delivery.deliveredAt, label: `판매자 ${delivery.sellerId} 배송 완료` })
    }
  }
  for (const item of detail.items) {
    if (item.confirmedAt) {
      events.push({
        at: item.confirmedAt,
        label: `${item.productName} 구매확정${item.confirmType === 'AUTO' ? ' (자동)' : ''}`,
        note: 'order-item.purchase-confirmed → 정산 대상 등록',
      })
    }
  }

  return (
    <ol className="space-y-2 border-l-2 pl-4">
      {events.map((event, index) => (
        <li key={index} className="text-sm">
          <span className="font-medium">{event.label}</span>{' '}
          <span className="text-muted-foreground">{event.at ? formatDateTime(event.at) : ''}</span>
          {event.note && (
            <div className="text-muted-foreground font-mono text-xs">{event.note}</div>
          )}
        </li>
      ))}
    </ol>
  )
}
