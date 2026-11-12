import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adminSettlementApi, settlementKeys } from '@/entities/settlement'
import { runWithAction } from '@/shared/api'

/** 지급 재요청 (204). 결과는 결제가 이벤트로 돌려주므로 목록을 다시 받아 상태를 본다 */
export function useRetrySettlementPayout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (settlementId: string) =>
      runWithAction('정산 지급 재요청', () => adminSettlementApi.retry(settlementId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settlementKeys.all }),
  })
}
