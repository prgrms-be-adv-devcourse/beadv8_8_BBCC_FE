import type { ReactNode } from 'react'
import { formatDateTime, formatWon } from '@/shared/lib'
import { Badge } from '@/shared/ui/badge'
import { CHARGE_STATUS_LABEL, type Charge } from '../model/wallet'

type ChargeRowProps = { charge: Charge; action?: ReactNode }

export function ChargeRow({ charge, action }: ChargeRowProps) {
  return (
    <div className="flex items-center justify-between border-t pt-2 text-sm">
      <span>
        충전 #{charge.id} · {formatWon(charge.amount)} ·{' '}
        {charge.approvedAt
          ? `${formatDateTime(charge.approvedAt)} 승인`
          : `${formatDateTime(charge.createdAt)} 요청`}{' '}
        <Badge variant={charge.status === 'DONE' ? 'success' : 'muted'}>
          {CHARGE_STATUS_LABEL[charge.status]}
        </Badge>
      </span>
      {action}
    </div>
  )
}
