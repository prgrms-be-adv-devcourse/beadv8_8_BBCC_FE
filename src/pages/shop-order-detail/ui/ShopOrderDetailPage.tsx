import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Link, useParams } from 'react-router'
import {
  CANCEL_REASON_LABEL,
  canConfirmItem,
  deliveryOf,
  needsCharge,
  OrderDeliveryList,
  OrderItemRow,
  OrderProgressBar,
  orderProgress,
  useOrderQuery,
} from '@/entities/order'
import {
  checkOrderPayment,
  findPaymentOfOrder,
  PaymentCard,
  paymentKeys,
  usePaymentsQuery,
} from '@/entities/payment'
import { walletKeys } from '@/entities/wallet'
import { ConfirmPurchaseButton } from '@/features/confirm-purchase'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { formatDateTime, formatWon } from '@/shared/lib'
import { Card, CardTitle } from '@/shared/ui/card'
import { StateMessage } from '@/shared/ui/page-header'

export function ShopOrderDetailPage() {
  const { orderId = '' } = useParams()
  const query = useOrderQuery(orderId)
  const queryClient = useQueryClient()
  const status = query.data?.status
  const awaiting = query.data?.status === 'PENDING_PAYMENT'
  // 결제 결과가 나온 뒤에만 결제 도메인 기록을 조회한다 (처리 중에는 기록이 없거나 반영 전)
  const payments = usePaymentsQuery({ enabled: query.isSuccess && !awaiting })

  // 결제 결과가 나오면 예치금 잔액이 바뀌었으므로 다음 조회 때 새로 받는다
  useEffect(() => {
    if (status && status !== 'PENDING_PAYMENT') {
      void queryClient.invalidateQueries({ queryKey: walletKeys.me })
      void queryClient.invalidateQueries({ queryKey: paymentKeys.list })
    }
  }, [status, queryClient])

  if (query.isPending) return <StateMessage>불러오는 중…</StateMessage>
  if (query.isError) return <StateMessage tone="error">{getErrorMessage(query.error)}</StateMessage>

  const order = query.data
  const progress = orderProgress(order)
  const payment = findPaymentOfOrder(payments.data, order.id)

  return (
    <div className="space-y-4">
      <Link to={paths.shop.orders} className="text-muted-foreground text-sm hover:underline">
        ← 주문 내역
      </Link>
      <div>
        <h1 className="text-2xl font-bold">주문번호 {order.id}</h1>
        <p className="text-muted-foreground text-sm">{formatDateTime(order.orderedAt)} 주문</p>
      </div>

      <Card className="space-y-4 py-6">
        <OrderProgressBar {...progress} />
        {order.status === 'PENDING_PAYMENT' && (
          <p className="text-primary text-center text-sm font-medium">
            예치금으로 결제하는 중이에요… 잠시만 기다려 주세요
          </p>
        )}
        {order.status === 'CANCELLED' && (
          <div className="space-y-1 text-center text-sm">
            <p>
              {order.cancelReason ? CANCEL_REASON_LABEL[order.cancelReason] : '주문이 취소됐어요.'}{' '}
              예치금은 빠져나가지 않았어요.
            </p>
            {needsCharge(order) && (
              <Link to={paths.shop.wallet} className="text-primary underline">
                예치금 충전하러 가기
              </Link>
            )}
          </div>
        )}
      </Card>

      <Card className="space-y-2">
        <CardTitle>주문 상품</CardTitle>
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
        <div className="flex justify-between border-t pt-2 font-bold">
          <span>결제 금액 (예치금)</span>
          <span>{formatWon(order.totalAmount)}</span>
        </div>
      </Card>

      <PaymentCard
        payment={payment}
        check={checkOrderPayment(order, payment)}
        pending={payments.isLoading}
        error={payments.error}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="space-y-1 text-sm">
          <CardTitle className="mb-1">배송지</CardTitle>
          <p>
            {order.shippingAddress.recipientName} · {order.shippingAddress.phone}
          </p>
          <p className="text-muted-foreground">
            ({order.shippingAddress.zipCode}) {order.shippingAddress.address}
          </p>
        </Card>
        <Card className="space-y-2">
          <CardTitle>배송</CardTitle>
          {order.deliveries.length === 0 ? (
            <StateMessage>결제가 끝나면 판매자별 배송이 생겨요.</StateMessage>
          ) : (
            <OrderDeliveryList order={order} />
          )}
        </Card>
      </div>
    </div>
  )
}
