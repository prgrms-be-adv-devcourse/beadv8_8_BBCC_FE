import { carrierName, DELIVERY_STATUS_LABEL } from '@/shared/config'
import { Badge } from '@/shared/ui/badge'
import { StateMessage } from '@/shared/ui/StateMessage'
import type { Order } from '../model/order'

type OrderDeliveryListProps = { order: Order }

export function OrderDeliveryList({ order }: OrderDeliveryListProps) {
  return (
    <>
      {order.deliveries.length === 0 && (
        <StateMessage>결제가 끝나면 판매자별 배송이 만들어져요.</StateMessage>
      )}
      {order.deliveries.map((delivery) => (
        <div key={delivery.id} className="flex justify-between border-t pt-2 text-sm">
          <span>
            판매자 {delivery.sellerId} · 판매 주문 #{delivery.id}
          </span>
          <span>
            <Badge>{DELIVERY_STATUS_LABEL[delivery.status]}</Badge>{' '}
            {delivery.trackingNumber &&
              `${carrierName(delivery.carrier)} ${delivery.trackingNumber}`}
          </span>
        </div>
      ))}
      <p className="text-muted-foreground text-xs">
        받는 분 {order.shippingAddress.recipientName} · {order.shippingAddress.address}
      </p>
    </>
  )
}
