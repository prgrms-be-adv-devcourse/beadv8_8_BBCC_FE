import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useApproveSeller } from '../model/use-approve-seller'

type ApproveSellerButtonProps = { applicationId: string }

export function ApproveSellerButton({ applicationId }: ApproveSellerButtonProps) {
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
