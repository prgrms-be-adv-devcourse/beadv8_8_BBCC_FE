import { useMutation, useQueryClient } from '@tanstack/react-query'
import { settlementApi, settlementKeys } from '@/entities/settlement'
import { runWithAction } from '@/shared/api'

/** 실패 정산 재처리 (목): 같은 settlementId로 다시 적립 요청 */
export function useRetrySettlement(settlementId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => runWithAction('정산 재처리', () => settlementApi.retry(settlementId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settlementKeys.all }),
  })
}
