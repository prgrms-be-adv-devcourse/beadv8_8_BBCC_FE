import { useMutation, useQueryClient } from '@tanstack/react-query'
import { settlementApi, settlementKeys, toSettlementRunResult } from '@/entities/settlement'
import { runWithAction } from '@/shared/api'

/** 시연용 수동 실행. 종료 기준일 0시 전에 구매확정된 미정산분을 판매자별로 정산한다 (같은 기준일은 409) */
export function useRunSettlement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (cutoffOn: string) =>
      runWithAction('정산 실행', async () =>
        toSettlementRunResult(await settlementApi.run({ cutoffOn })),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settlementKeys.all }),
  })
}
