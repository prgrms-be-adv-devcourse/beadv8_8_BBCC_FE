import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adminMemberApi, memberKeys } from '@/entities/member'
import { sellerApi } from '@/entities/seller'
import { runWithAction } from '@/shared/api'

/** 회원 이용 정지 (로그인 · 재발급이 막힌다) */
export function useSuspendMember(memberId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (reason: string) =>
      runWithAction('회원 이용 정지', () => adminMemberApi.suspend(memberId, { reason })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: memberKeys.all }),
  })
}

/** 판매자 자격 정지 (판매자 ID = 회원 ID). 정지 후 상품 처리는 보류 (기획서 2.1) */
export function useSuspendSeller(sellerId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (reason: string) =>
      runWithAction('판매자 자격 정지', () => sellerApi.suspend(sellerId, { reason })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: memberKeys.all }),
  })
}
