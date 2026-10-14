import type { ReactNode } from 'react'
import { formatDateTime, formatWon } from '@/shared/lib'
import { Badge } from '@/shared/ui/badge'
import { CHARGE_STATUS_LABEL, type Charge } from '../model/wallet'

export function ChargeRow({ charge, action }: { charge: Charge; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between border-t pt-2 text-sm">
      <span>
        충전 #{charge.id} · {formatWon(charge.amount)} · {formatDateTime(charge.approvedAt)}{' '}
        <Badge variant={charge.status === 'DONE' ? 'success' : 'muted'}>
          {CHARGE_STATUS_LABEL[charge.status]}
        </Badge>
      </span>
      {action}
    </div>
  )
}
