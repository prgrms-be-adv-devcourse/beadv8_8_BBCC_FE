import { Badge } from '@/shared/ui/badge'
import { ORDER_STATUS_LABEL, type OrderStatus } from '../model/order'
import { labelOf } from '@/shared/lib'

const VARIANT = { PENDING_PAYMENT: 'default', PAID: 'success', CANCELLED: 'destructive' } as const

type OrderStatusBadgeProps = { status: OrderStatus }

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  return <Badge variant={VARIANT[status]}>{labelOf(ORDER_STATUS_LABEL, status)}</Badge>
}
