import type { Charge } from '@/entities/wallet'
import { getErrorMessage } from '@/shared/api'
import { formatWon } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/page-header'
import { useCancelCharge } from '../model/use-cancel-charge'

export function CancelChargeButton({ charge }: { charge: Charge }) {
  const cancel = useCancelCharge(charge.id)

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
          ) {
            cancel.mutate()
          }
        }}
      >
        충전 취소
      </Button>
      {cancel.isError && <StateMessage tone="error">{getErrorMessage(cancel.error)}</StateMessage>}
    </div>
  )
}
