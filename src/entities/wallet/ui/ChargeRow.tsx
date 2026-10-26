import type { ReactNode } from 'react'
import { cn, formatDateTime, formatWon } from '@/shared/lib'
import { CHARGE_STATUS_LABEL, type Charge } from '../model/wallet'

type ChargeRowProps = { charge: Charge; action?: ReactNode }

/** 충전 내역 한 줄: 충전 번호 · 승인(요청) 시각 왼쪽, 상태 · 금액 · 동작 오른쪽 */
export function ChargeRow({ charge, action }: ChargeRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 text-sm">
      <span className="min-w-0 space-y-0.5">
        <span className="figure block font-semibold">충전 #{charge.id}</span>
        <span className="text-muted-foreground figure block text-xs">
          {charge.approvedAt
            ? `${formatDateTime(charge.approvedAt)} 승인`
            : `${formatDateTime(charge.createdAt)} 요청`}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-3">
        <span
          className={cn(
            'text-xs font-semibold',
            charge.status === 'DONE' ? 'text-primary' : 'text-muted-foreground',
          )}
        >
          {CHARGE_STATUS_LABEL[charge.status]}
        </span>
        <span className="figure text-[15px] font-bold">{formatWon(charge.amount)}</span>
        {action}
      </span>
    </div>
  )
}
