import { useState } from 'react'
import { getErrorMessage } from '@/shared/api'
import { formatWon } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useRunSettlement } from '../model/use-run-settlement'

export function RunSettlementButton() {
  const run = useRunSettlement()
  const [simulateFailure, setSimulateFailure] = useState(false)

  return (
    <div className="space-y-2">
      <Button
        disabled={run.isPending}
        onClick={() => {
          if (window.confirm('오늘을 종료 기준일로 정산을 실행할까요?')) {
            run.mutate({
              periodEnd: new Date().toISOString().slice(0, 10),
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
