import { useState } from 'react'
import { SETTLEMENT_RUN_STATUS_LABEL } from '@/entities/settlement'
import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/StateMessage'
import { settlementPeriodEnd } from '../lib/period-end'
import { useRunSettlement } from '../model/use-run-settlement'

export function RunSettlementButton() {
  const run = useRunSettlement()
  // 정산은 종료 기준일 "이전" 구매확정분만 대상이다. 시연에서는 방금 구매확정한 상품까지 넣으려고 내일을 기준일로 보낸다
  const [includeToday, setIncludeToday] = useState(true)

  return (
    <div className="space-y-2">
      <Button
        disabled={run.isPending}
        onClick={() => {
          const cutoffOn = settlementPeriodEnd(new Date(), includeToday)
          if (window.confirm(`${cutoffOn} 0시 전 구매확정분으로 정산을 실행할까요?`)) {
            run.mutate(cutoffOn)
          }
        }}
      >
        정산 실행
      </Button>
      <label className="text-muted-foreground flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={includeToday}
          onChange={(e) => setIncludeToday(e.target.checked)}
        />
        오늘 구매확정분까지 포함 (시연용)
      </label>
      {run.isError && <StateMessage tone="error">{getErrorMessage(run.error)}</StateMessage>}
      {run.data && (
        <StateMessage>
          정산 {SETTLEMENT_RUN_STATUS_LABEL[run.data.status] ?? run.data.status} · 성공{' '}
          {run.data.successCount} · 실패 {run.data.failCount} · 기간 {run.data.periodStart} ~{' '}
          {run.data.periodEnd}
        </StateMessage>
      )}
    </div>
  )
}
