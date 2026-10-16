import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useRevokeAdmin } from '../model/use-manage-admin-role'

type RevokeAdminButtonProps = { memberId: string }

export function RevokeAdminButton({ memberId }: RevokeAdminButtonProps) {
  const revoke = useRevokeAdmin(memberId)
  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={revoke.isPending}
        onClick={() => revoke.mutate()}
      >
        권한 해제
      </Button>
      {revoke.isError && <StateMessage tone="error">{getErrorMessage(revoke.error)}</StateMessage>}
    </div>
  )
}
