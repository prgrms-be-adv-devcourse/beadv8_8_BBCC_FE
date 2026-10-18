import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useAbandonCharge } from '../model/use-charge-wallet'

type AbandonChargeButtonProps = { tossOrderId: string }

/** 결제창에서 돌아오지 않은 충전을 그만둔다. 돈이 오가지 않으므로 확인 창은 띄우지 않는다 */
export function AbandonChargeButton({ tossOrderId }: AbandonChargeButtonProps) {
  const abandon = useAbandonCharge(tossOrderId)

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={abandon.isPending}
        onClick={() => abandon.mutate()}
      >
        그만두기
      </Button>
      {abandon.isError && (
        <StateMessage tone="error">{getErrorMessage(abandon.error)}</StateMessage>
      )}
    </div>
  )
}
