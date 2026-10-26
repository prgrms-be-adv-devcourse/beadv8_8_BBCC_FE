import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useApproveSeller } from '../model/use-approve-seller'

type ApproveSellerButtonProps = { applicationId: string }

export function ApproveSellerButton({ applicationId }: ApproveSellerButtonProps) {
  const approve = useApproveSeller()
  return (
    <span className="flex items-center gap-2">
      <Button
        className="max-lg:h-11"
        disabled={approve.isPending}
        aria-busy={approve.isPending}
        onClick={() => approve.mutate(applicationId)}
      >
        승인
      </Button>
      {approve.isError && (
        <StateMessage tone="error">{getErrorMessage(approve.error)}</StateMessage>
      )}
    </span>
  )
}
