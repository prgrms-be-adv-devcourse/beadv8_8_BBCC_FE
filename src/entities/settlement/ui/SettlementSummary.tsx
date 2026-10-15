import type { ReactNode } from 'react'
import { formatDateTime, formatWon } from '@/shared/lib'
import { Badge } from '@/shared/ui/badge'
import { SETTLEMENT_STATUS_LABEL, type Settlement } from '../model/settlement'

type SettlementSummaryProps = {
  settlement: Settlement
  action?: ReactNode
}

const STATUS_VARIANT = { COMPLETED: 'muted', PAID: 'success', FAILED: 'destructive' } as const

/** 정산서 한 줄: 기간 · 판매 − 수수료 = 지급 · 상태 */
export function SettlementSummary({ settlement, action }: SettlementSummaryProps) {
  return (
    <div className="text-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium">
          정산서 #{settlement.id} · {settlement.periodStart} ~ {settlement.periodEnd}{' '}
          <Badge variant={STATUS_VARIANT[settlement.status]}>
            {SETTLEMENT_STATUS_LABEL[settlement.status]}
          </Badge>
        </p>
        {action}
      </div>
      <p className="text-muted-foreground">
        판매 {formatWon(settlement.totalAmount)} − 수수료 {formatWon(settlement.feeAmount)} (
        {settlement.feeRatePercent}
        %) ={' '}
        <span className="text-foreground font-semibold">
          지급 {formatWon(settlement.payoutAmount)}
        </span>
        {settlement.paidAt && ` · 예치금 입금 ${formatDateTime(settlement.paidAt)}`}
      </p>
    </div>
  )
}
