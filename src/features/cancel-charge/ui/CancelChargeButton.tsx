import { useMutation, useQueryClient } from '@tanstack/react-query'
import { walletKeys, type ChargeDetail } from '@/entities/wallet'
import { apiClient, getErrorMessage, runWithAction } from '@/shared/api'
import { formatWon } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/page-header'

/**
 * 충전 취소 = 토스 결제 취소(PG 취소 · 환불). 기획서 ④ · P7: 그 충전 금액만큼 잔액이 남아 있을 때만 전액 취소.
 * 백엔드에 아직 없어 목 응답이다. 경로는 구현된 충전 API 앞부분(/wallets/me/charges)에 맞췄다.
 */
export function CancelChargeButton({ charge }: { charge: ChargeDetail }) {
  const queryClient = useQueryClient()

  const cancel = useMutation({
    mutationFn: () =>
      runWithAction('충전 취소', () =>
        apiClient.post(`/wallets/me/charges/${charge.chargeId}/cancel`),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: walletKeys.me })
      void queryClient.invalidateQueries({ queryKey: walletKeys.charge(charge.chargeId) })
    },
  })

  if (cancel.isSuccess) {
    return <StateMessage>취소 요청됨 (목 · 실제 잔액은 바뀌지 않아요)</StateMessage>
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={cancel.isPending}
        onClick={() => {
          if (
            window.confirm(
              `${formatWon(charge.amount)} 충전을 취소할까요? 토스 결제가 취소되고 잔액에서 빠져요.`,
            )
          )
            cancel.mutate()
        }}
      >
        충전 취소
      </Button>
      {cancel.isError && <StateMessage tone="error">{getErrorMessage(cancel.error)}</StateMessage>}
    </div>
  )
}
