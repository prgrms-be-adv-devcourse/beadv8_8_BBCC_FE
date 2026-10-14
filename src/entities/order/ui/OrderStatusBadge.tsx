import { Badge } from '@/shared/ui/badge'
import { ORDER_STATUS_LABEL, type OrderStatus } from '../model/order'

const VARIANT = { PENDING_PAYMENT: 'default', PAID: 'success', CANCELLED: 'destructive' } as const

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge variant={VARIANT[status]}>{ORDER_STATUS_LABEL[status]}</Badge>
}
