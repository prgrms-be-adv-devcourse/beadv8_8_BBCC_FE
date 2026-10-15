import { Link, useParams } from 'react-router'
import {
  buildOrderTimeline,
  canConfirmItem,
  deliveryOf,
  needsCartReview,
  OrderProcessSteps,
  needsCharge,
  OrderDeliveryList,
  OrderItemRow,
  OrderStatusBanner,
  OrderTimeline,
} from '@/entities/order'
import { PaymentCard } from '@/entities/payment'
import { useWalletQuery, WalletBalanceCard } from '@/entities/wallet'
import { ConfirmPurchaseButton } from '@/features/confirm-purchase'
import { useOrderTracking } from '@/features/track-order'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { formatDateTime, formatWon } from '@/shared/lib'
import { Card, CardTitle } from '@/shared/ui/card'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StateMessage } from '@/shared/ui/StateMessage'

export function ConsoleOrderDetailPage() {
  const { orderId = '' } = useParams()
  const { query, payments, payment, paymentCheck, delayed } = useOrderTracking(orderId)
  const wallet = useWalletQuery()

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
        delayed={delayed}
        cancelAction={
          needsCharge(order) ? (
            <Link to={paths.console.wallet} className="text-primary text-sm underline">
              예치금 충전하러 가기
            </Link>
          ) : (
            needsCartReview(order) && (
              <Link to={paths.console.cart} className="text-primary text-sm underline">
                장바구니에서 다시 확인하기
              </Link>
            )
          )
        }
      />

      <Card>
        <OrderProcessSteps order={order} showEvents />
      </Card>

      <WalletBalanceCard
        title="내 예치금 잔액 (결제 결과가 나오면 다시 조회)"
        wallet={wallet.data}
        pending={wallet.isPending}
        error={wallet.error}
      />

      {paymentCheck && (
        <PaymentCard
          payment={payment}
          check={paymentCheck}
          pending={payments.isLoading}
          error={payments.error}
        />
      )}

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
            cancelled={order.status === 'CANCELLED'}
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
