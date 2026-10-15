import { Badge } from '@/shared/ui/badge'
import { ORDER_STATUS_LABEL, type OrderStatus } from '../model/order'

const VARIANT = { PENDING_PAYMENT: 'default', PAID: 'success', CANCELLED: 'destructive' } as const

type OrderStatusBadgeProps = { status: OrderStatus }

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  return <Badge variant={VARIANT[status]}>{ORDER_STATUS_LABEL[status]}</Badge>
}
