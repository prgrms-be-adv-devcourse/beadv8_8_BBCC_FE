import { isChargeCancelling, type Charge } from '@/entities/wallet'
import { getErrorMessage, isTimeoutError } from '@/shared/api'
import { formatWon, confirmAction } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useCancelCharge } from '../model/use-cancel-charge'

type CancelChargeButtonProps = { charge: Charge }

export function CancelChargeButton({ charge }: CancelChargeButtonProps) {
  const cancel = useCancelCharge(charge.id)
  // 응답이 늦어 기다리지 못함: BE는 취소를 시작했을 수 있으므로 202(취소 중)와 같이 안내한다
  const isResultUnknown = cancel.isError && isTimeoutError(cancel.error)

  if (isResultUnknown || (cancel.data && isChargeCancelling(cancel.data))) {
    return (
      <StateMessage>
        토스 결과를 확인하는 중이에요. 충전 내역에서 상태를 확인해 주세요.
      </StateMessage>
    )
  }
  if (cancel.data) {
    return (
      <StateMessage>
        {`취소했어요.${cancel.data.balance !== null ? ` 잔액 ${formatWon(cancel.data.balance)}` : ''}`}
      </StateMessage>
    )
  }
  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={cancel.isPending}
        onClick={async () => {
          if (
            await confirmAction({
              title: `${formatWon(charge.amount)} 충전을 취소할까요?`,
              description: '토스 결제가 취소되고 잔액에서 빠져요.',
              confirmLabel: '충전 취소',
              tone: 'danger',
            })
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
