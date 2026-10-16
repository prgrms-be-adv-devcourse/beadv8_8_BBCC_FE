import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toChargeCancellation, walletApi, walletKeys } from '@/entities/wallet'
import { toast } from '@/shared/lib'
import { runWithAction } from '@/shared/api'

/** 충전 취소 = 토스 결제 취소(PG 취소 · 환불). 기획서 P7: 그 금액만큼 잔액이 남아 있을 때만 전액 취소 */
export function useCancelCharge(chargeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () =>
      runWithAction('충전 취소', async () =>
        toChargeCancellation(await walletApi.cancelCharge(chargeId)),
      ),
    onSuccess: () => {
      toast('충전을 취소했어요')
      // 잔액 · 충전 내역 · 거래 내역 (wallet 아래 모두)
      void queryClient.invalidateQueries({ queryKey: walletKeys.all })
    },
  })
}
