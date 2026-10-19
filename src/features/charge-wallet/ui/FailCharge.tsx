import { isChargeAlreadyEnded } from '@/entities/wallet'
import { getErrorMessage, getErrorStatus } from '@/shared/api'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useFailCharge } from '../model/use-charge-wallet'

type FailChargeProps = { search: URLSearchParams }

/** 토스 failUrl로 돌아왔을 때: 결제창 메시지를 보여 주고 그 충전을 실패로 끝낸다 */
export function FailCharge({ search }: FailChargeProps) {
  const fail = useFailCharge(search)

  return (
    <div className="space-y-2">
      <p className="text-sm">{search.get('message') ?? '결제가 취소되었거나 실패했어요.'}</p>
      {fail.isPending && !fail.invalidRequest && (
        <StateMessage>충전 요청을 정리하는 중이에요…</StateMessage>
      )}
      {fail.isSuccess && (
        <StateMessage>
          이 충전은 결제되지 않았어요. 다시 충전하려면 새로 요청해 주세요.
        </StateMessage>
      )}
      {fail.isError && isChargeAlreadyEnded(getErrorStatus(fail.error)) && (
        <StateMessage>이미 끝난 충전이에요. 결과는 충전 내역에서 확인해 주세요.</StateMessage>
      )}
      {fail.isError && !isChargeAlreadyEnded(getErrorStatus(fail.error)) && (
        <StateMessage tone="error">{getErrorMessage(fail.error)}</StateMessage>
      )}
    </div>
  )
}
