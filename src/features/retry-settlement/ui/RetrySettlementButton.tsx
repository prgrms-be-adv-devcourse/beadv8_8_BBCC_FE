import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/page-header'
import { useRetrySettlement } from '../model/use-retry-settlement'

export function RetrySettlementButton({ settlementId }: { settlementId: string }) {
  const retry = useRetrySettlement(settlementId)
  return (
    <span className="flex items-center gap-2">
      <Button size="sm" disabled={retry.isPending} onClick={() => retry.mutate()}>
        재처리
      </Button>
      {retry.isError && <StateMessage tone="error">{getErrorMessage(retry.error)}</StateMessage>}
    </span>
  )
}
