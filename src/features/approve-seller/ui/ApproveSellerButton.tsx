import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/page-header'
import { useApproveSeller } from '../model/use-approve-seller'

export function ApproveSellerButton({ applicationId }: { applicationId: string }) {
  const approve = useApproveSeller()
  return (
    <div className="flex items-center gap-2">
      <Button size="sm" disabled={approve.isPending} onClick={() => approve.mutate(applicationId)}>
        승인
      </Button>
      {approve.isError && (
        <StateMessage tone="error">{getErrorMessage(approve.error)}</StateMessage>
      )}
    </div>
  )
}
