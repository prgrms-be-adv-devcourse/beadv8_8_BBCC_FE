import { getErrorMessage } from '@/shared/api'
import { formatWon } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/page-header'
import { useRunSettlement } from '../model/use-run-settlement'

export function RunSettlementButton() {
  const run = useRunSettlement()

  return (
    <div className="space-y-2">
      <Button
        disabled={run.isPending}
        onClick={() => {
          if (window.confirm('오늘을 종료 기준일로 정산을 실행할까요?')) {
            run.mutate(new Date().toISOString().slice(0, 10))
          }
        }}
      >
        정산 실행
      </Button>
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
