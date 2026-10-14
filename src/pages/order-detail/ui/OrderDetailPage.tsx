import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
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
import { useWalletQuery, WalletBalanceCard, walletKeys } from '@/entities/wallet'
import { ConfirmPurchaseButton } from '@/features/confirm-purchase'
import { getErrorMessage } from '@/shared/api'
import { formatDateTime, formatWon } from '@/shared/lib'
import { Card, CardTitle } from '@/shared/ui/card'
import { PageHeader, StateMessage } from '@/shared/ui/page-header'

export function OrderDetailPage() {
  const { orderId = '' } = useParams()
  const query = useOrderQuery(orderId)
  const wallet = useWalletQuery()
  const queryClient = useQueryClient()
  const status = query.data?.status

  // 결제 결과가 나오면 잔액을 다시 조회해 예치금 차감을 화면과 흐름 패널(상태 변화)에서 확인한다
  useEffect(() => {
    if (status && status !== 'PENDING_PAYMENT') {
      void queryClient.invalidateQueries({ queryKey: walletKeys.me })
    }
  }, [status, queryClient])

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

      <WalletBalanceCard
        title="내 예치금 잔액 (결제 결과가 나오면 다시 조회)"
        wallet={wallet.data}
        pending={wallet.isPending}
        error={wallet.error}
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
