import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  sellerApi,
  sellerKeys,
  toSellerApplicationRequest,
  type SellerApplicationForm,
} from '@/entities/seller'
import { refreshSession } from '@/entities/session'
import { runWithAction } from '@/shared/api'

export function useApplySeller() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (form: SellerApplicationForm) =>
      runWithAction('판매자 신청', () => sellerApi.apply(toSellerApplicationRequest(form))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sellerKeys.myApplication }),
  })
}

/** 승인 뒤 재발급으로 SELLER 역할을 받는다 (카카오 로그인 세션만 가능. 시연 역할은 판매자 버튼으로 전환) */
export function useRefreshSellerRole() {
  return useMutation({ mutationFn: () => runWithAction('역할 다시 받기 (재발급)', refreshSession) })
}
