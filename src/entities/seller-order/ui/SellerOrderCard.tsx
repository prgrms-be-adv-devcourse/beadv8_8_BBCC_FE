import type { ReactNode } from 'react'
import { carrierName, DELIVERY_STATUS_LABEL } from '@/shared/config'
import { formatDateTime, formatWon, optionLabel } from '@/shared/lib'
import { Badge } from '@/shared/ui/badge'
import { Card } from '@/shared/ui/card'
import type { SellerOrder } from '../model/seller-order'

type SellerOrderCardProps = { order: SellerOrder; action?: ReactNode }

export function SellerOrderCard({ order, action }: SellerOrderCardProps) {
  return (
    <Card className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-medium">
          판매 주문 #{order.id}{' '}
          <span className="text-muted-foreground text-sm">(주문 #{order.orderId})</span>
        </p>
        <Badge>{DELIVERY_STATUS_LABEL[order.status]}</Badge>
      </div>
      <ul className="text-sm">
        {order.items.map((item) => (
          <li key={item.id}>
            {[item.productName, optionLabel(item)].filter(Boolean).join(' · ')} × {item.quantity} ={' '}
            {formatWon(item.amount)}
            {item.childLabel && ` · ${item.childLabel}`}
          </li>
        ))}
      </ul>
      <p className="text-muted-foreground text-xs">
        {formatDateTime(order.orderedAt)} 주문 · 받는 분 {order.recipientName} · {order.address}
        {order.trackingNumber && ` · ${carrierName(order.carrier)} ${order.trackingNumber}`}
      </p>
      {action}
    </Card>
  )
}
