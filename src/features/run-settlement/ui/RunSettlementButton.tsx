import { useState } from 'react'
import { getErrorMessage } from '@/shared/api'
import { formatWon } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/StateMessage'
import { settlementPeriodEnd } from '../lib/period-end'
import { useRunSettlement } from '../model/use-run-settlement'

export function RunSettlementButton() {
  const run = useRunSettlement()
  const [simulateFailure, setSimulateFailure] = useState(false)
  // 정산은 종료 기준일 "이전" 구매확정분만 대상이다. 시연에서는 방금 구매확정한 상품까지 넣으려고 내일을 기준일로 보낸다
  const [includeToday, setIncludeToday] = useState(true)

  return (
    <div className="space-y-2">
      <Button
        disabled={run.isPending}
        onClick={() => {
          const periodEnd = settlementPeriodEnd(new Date(), includeToday)
          if (window.confirm(`${periodEnd} 이전 구매확정분으로 정산을 실행할까요?`)) {
            run.mutate({
              periodEnd,
              simulatePayoutFailure: simulateFailure,
            })
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
      <label className="text-muted-foreground flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={simulateFailure}
          onChange={(e) => setSimulateFailure(e.target.checked)}
        />
        판매자 지갑 적립 실패를 흉내 내기 (목 · 재처리 시연용)
      </label>
      {run.isError && <StateMessage tone="error">{getErrorMessage(run.error)}</StateMessage>}
      {run.data && (
        <StateMessage>
          판매자 {run.data.settlementCount}명 정산 완료
          {run.data.settlements.map((settlement) => (
            <span key={settlement.id}>
              {' '}
              · 판매자 {settlement.sellerId} 지급 {formatWon(settlement.payoutAmount)}
            </span>
          ))}
        </StateMessage>
      )}
    </div>
  )
}
