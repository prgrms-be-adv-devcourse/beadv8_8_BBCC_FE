import { getErrorMessage } from '@/shared/api'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useRevokeAdmin } from '../model/use-manage-admin-role'
import { ROLE_ACTION_CLASS } from './role-action'

type RevokeAdminButtonProps = { memberId: string }

export function RevokeAdminButton({ memberId }: RevokeAdminButtonProps) {
  const revoke = useRevokeAdmin(memberId)
  return (
    <span className="flex shrink-0 flex-col items-end gap-1">
      <button
        type="button"
        className={ROLE_ACTION_CLASS}
        disabled={revoke.isPending}
        onClick={() => revoke.mutate()}
      >
        권한 해제
      </button>
      {revoke.isError && <StateMessage tone="error">{getErrorMessage(revoke.error)}</StateMessage>}
    </span>
  )
}
