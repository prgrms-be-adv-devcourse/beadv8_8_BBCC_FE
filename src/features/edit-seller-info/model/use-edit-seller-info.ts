import { useMutation, useQueryClient } from '@tanstack/react-query'
import { sellerApi, sellerKeys } from '@/entities/seller'
import { runWithAction } from '@/shared/api'

/** 상호명 수정 (목) → seller.changed. 응답으로 내 판매자 정보 캐시를 바꾼다 */
export function useUpdateBusinessName() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (businessName: string) =>
      runWithAction('판매자 정보 수정', () =>
        sellerApi.updateMine({ businessName: businessName.trim() }),
      ),
    onSuccess: (seller) => queryClient.setQueryData(sellerKeys.me, seller),
  })
}
