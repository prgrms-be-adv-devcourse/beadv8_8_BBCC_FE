import { Badge } from '@/shared/ui/badge'
import { APPLICATION_STATUS_LABEL, type SellerApplicationStatus } from '../model/seller'

export function ApplicationStatusBadge({ status }: { status: SellerApplicationStatus }) {
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
