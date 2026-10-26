import { formatDateTime, formatWon } from '@/shared/lib'
import type { Settlement } from '../model/settlement'

type SettlementSummaryProps = { settlement: Settlement }

/** 정산서 계산(판매 금액 − 수수료 = 지급액)과 기간 · 예치금 입금 시각 */
export function SettlementSummary({ settlement }: SettlementSummaryProps) {
  return (
    <div className="space-y-4 text-sm">
      <dl className="space-y-2">
        <div className="flex justify-between gap-4">
          <dt className="text-ink-3">판매 금액</dt>
          <dd className="figure">{formatWon(settlement.totalAmount)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-3">
            수수료 <span className="figure">({settlement.feeRatePercent}%)</span>
          </dt>
          <dd className="figure">− {formatWon(settlement.feeAmount)}</dd>
        </div>
        <div className="border-rule flex items-baseline justify-between gap-4 border-t pt-3">
          <dt className="font-semibold">지급액</dt>
          <dd className="figure text-base font-bold">{formatWon(settlement.payoutAmount)}</dd>
        </div>
      </dl>
      <dl className="border-rule space-y-2 border-t pt-4">
        <div className="flex justify-between gap-4">
          <dt className="text-ink-3">기간</dt>
          <dd className="figure">
            {settlement.periodStart} ~ {settlement.periodEnd}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-3">예치금 입금</dt>
          <dd className="figure">{formatDateTime(settlement.paidAt)}</dd>
        </div>
      </dl>
    </div>
  )
}
