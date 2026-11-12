import { approveBlockReason, canApprove, type SellerApplicationSummary } from '@/entities/seller'
import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useApproveSeller } from '../model/use-approve-seller'

type ApproveSellerButtonProps = { application: SellerApplicationSummary }

/** 승인할 수 없는 신청(탈퇴한 회원)이면 버튼을 막고 이유를 옆에 보인다 */
export function ApproveSellerButton({ application }: ApproveSellerButtonProps) {
  const approve = useApproveSeller()
  const blockReason = approveBlockReason(application)
  return (
    <span className="flex items-center gap-2">
      <Button
        className="max-lg:h-11"
        disabled={approve.isPending || !canApprove(application)}
        aria-busy={approve.isPending}
        onClick={() => approve.mutate(application.id)}
      >
        승인
      </Button>
      {blockReason && <StateMessage>{blockReason}</StateMessage>}
      {approve.isError && (
        <StateMessage tone="error">{getErrorMessage(approve.error)}</StateMessage>
      )}
    </span>
  )
}
