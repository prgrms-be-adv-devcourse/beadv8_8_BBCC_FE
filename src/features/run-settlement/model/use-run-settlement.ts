import { useMutation, useQueryClient } from '@tanstack/react-query'
import { settlementApi, settlementKeys, toSettlementRunResult } from '@/entities/settlement'
import { runWithAction } from '@/shared/api'

/** 시연용 수동 실행. 종료 기준일(오늘) 이전에 구매확정된 미정산분을 판매자별로 정산한다 */
export function useRunSettlement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      periodEnd,
      simulatePayoutFailure = false,
    }: {
      periodEnd: string
      simulatePayoutFailure?: boolean
    }) =>
      runWithAction('정산 실행', async () =>
        toSettlementRunResult(await settlementApi.run({ periodEnd, simulatePayoutFailure })),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settlementKeys.all }),
  })
}
