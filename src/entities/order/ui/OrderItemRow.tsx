import type { ReactNode } from 'react'
import { DELIVERY_STATUS_LABEL } from '@/shared/config'
import { formatWon } from '@/shared/lib'
import { Badge } from '@/shared/ui/badge'
import { ITEM_STATUS_LABEL, type OrderDelivery, type OrderItem } from '../model/order'

type Props = {
  item: OrderItem
  delivery: OrderDelivery | null
  /** 오른쪽 동작 (예: 구매확정 버튼) */
  action?: ReactNode
}

export function OrderItemRow({ item, delivery, action }: Props) {
  return (
    <div className="flex items-center justify-between border-t pt-2 text-sm">
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
      {action}
    </div>
  )
}
