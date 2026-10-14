import type { ReactNode } from 'react'
import { formatWon } from '@/shared/lib'
import type { Settlement } from '../model/settlement'

/** 정산서 한 줄: 판매 − 수수료 = 지급 */
export function SettlementSummary({
  settlement,
  action,
}: {
  settlement: Settlement
  action?: ReactNode
}) {
  return (
    <div className="text-sm">
      <div className="flex items-center justify-between">
        <p className="font-medium">
          정산서 #{settlement.id} · {settlement.periodEnd} 이전 구매확정분 · {settlement.itemCount}
          건
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
      </p>
    </div>
  )
}
