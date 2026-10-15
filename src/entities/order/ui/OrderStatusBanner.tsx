import type { ReactNode } from 'react'
import { formatWon } from '@/shared/lib'
import { Card } from '@/shared/ui/card'
import { CANCEL_REASON_LABEL, ORDER_STATUS_LABEL, type Order } from '../model/order'

type OrderStatusBannerProps = {
  order: Order
  /** 다시 조회 중 표시 */
  polling: boolean
  /** 취소됐을 때 아래에 붙일 동작 (예: 충전 링크) */
  cancelAction?: ReactNode
  /** 결제 처리 중이 너무 길다 (서버 이벤트가 오지 않음) */
  delayed?: boolean
}

export function OrderStatusBanner({
  order,
  polling,
  cancelAction,
  delayed = false,
}: OrderStatusBannerProps) {
  if (order.status === 'PENDING_PAYMENT') {
    return (
      <Card className="border-primary">
        <p className="font-semibold">
          결제 처리 중… {polling && (delayed ? '(10초마다 다시 조회)' : '(1초마다 다시 조회)')}
        </p>
        <p className="text-muted-foreground text-sm">
          주문하기는 주문을 결제대기로 저장하고 끝나요. 서버가 이벤트로 재고 차감 → 예치금 결제를
          이어서 해요.
        </p>
        {delayed && (
          <p role="alert" className="text-destructive mt-2 text-sm font-medium">
            30초가 넘도록 서버 이벤트(order.created → stock.deducted → 결제)가 오지 않고 있어요.
            상품의 재고 차감 처리와 이벤트 연결을 확인해 주세요. 10분이 지나면 주문이 취소돼요.
          </p>
        )}
      </Card>
    )
  }
  if (order.status === 'CANCELLED') {
    return (
      <Card className="border-destructive">
        <p className="text-destructive font-semibold">{ORDER_STATUS_LABEL.CANCELLED}</p>
        <p className="text-sm">
          {order.cancelReason ? CANCEL_REASON_LABEL[order.cancelReason] : '주문이 취소됐어요.'}{' '}
          재고는 복구되고 예치금은 차감되지 않았어요.
        </p>
        {cancelAction}
      </Card>
    )
  }
  return (
    <Card className="border-green-600">
      <p className="font-semibold text-green-700">{ORDER_STATUS_LABEL.PAID}</p>
      <p className="text-muted-foreground text-sm">
        재고가 차감되고 예치금에서 {formatWon(order.totalAmount)}이 결제됐어요.
      </p>
    </Card>
  )
}
