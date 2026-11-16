import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adminSettlementApi, settlementKeys } from '@/entities/settlement'
import { runWithAction } from '@/shared/api'

/** 실행 복구: 실행 중으로 남은 실행을 실패로 정리한다. 조회 결과 · 목록을 다시 받는다 */
export function useRecoverSettlementRun() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (runId: string) =>
      runWithAction('정산 실행 복구', () => adminSettlementApi.recover(runId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settlementKeys.all }),
  })
}
