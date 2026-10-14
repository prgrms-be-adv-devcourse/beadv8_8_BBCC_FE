import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { SettlementRunResult } from '@/entities/settlement'
import { apiClient, getErrorMessage, runWithAction } from '@/shared/api'
import { formatWon } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/page-header'

/** 시연용 수동 실행. 종료 기준일 이전에 구매확정된 미정산분을 판매자별로 정산한다 */
export function RunSettlementButton() {
  const queryClient = useQueryClient()

  const run = useMutation({
    mutationFn: () =>
      runWithAction('정산 실행', () =>
        apiClient.post<SettlementRunResult>('/admin/settlements/run', {
          periodEnd: new Date().toISOString().slice(0, 10),
        }),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settlement'] }),
  })

  return (
    <div className="space-y-2">
      <Button
        disabled={run.isPending}
        onClick={() => {
          if (window.confirm('오늘을 종료 기준일로 정산을 실행할까요?')) run.mutate()
        }}
      >
        정산 실행
      </Button>
      {run.isError && <StateMessage tone="error">{getErrorMessage(run.error)}</StateMessage>}
      {run.isSuccess && (
        <StateMessage>
          판매자 {run.data.data.settlementCount}명 정산 완료
          {run.data.data.settlements.map((settlement) => (
            <span key={settlement.settlementId}>
              {' '}
              · 판매자 {settlement.sellerId} 지급 {formatWon(settlement.payoutAmount)}
            </span>
          ))}
        </StateMessage>
      )}
    </div>
  )
}
