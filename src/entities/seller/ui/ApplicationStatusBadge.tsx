import { Badge } from '@/shared/ui/badge'
import { APPLICATION_STATUS_LABEL, type SellerApplicationStatus } from '../model/seller'

type ApplicationStatusBadgeProps = { status: SellerApplicationStatus }

export function ApplicationStatusBadge({ status }: ApplicationStatusBadgeProps) {
  return (
    <Badge
      variant={
        status === 'APPROVED' ? 'success' : status === 'REJECTED' ? 'destructive' : 'default'
      }
    >
      {APPLICATION_STATUS_LABEL[status]}
    </Badge>
  )
}
