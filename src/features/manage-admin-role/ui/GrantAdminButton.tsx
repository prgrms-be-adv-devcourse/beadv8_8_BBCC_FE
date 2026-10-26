import { getErrorMessage } from '@/shared/api'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useGrantAdmin } from '../model/use-manage-admin-role'
import { ROLE_ACTION_CLASS } from './role-action'

type GrantAdminButtonProps = { memberId: string }

export function GrantAdminButton({ memberId }: GrantAdminButtonProps) {
  const grant = useGrantAdmin(memberId)
  return (
    <span className="flex shrink-0 flex-col items-end gap-1">
      <button
        type="button"
        className={ROLE_ACTION_CLASS}
        disabled={grant.isPending}
        onClick={() => grant.mutate()}
      >
        관리자 지정
      </button>
      {grant.isError && <StateMessage tone="error">{getErrorMessage(grant.error)}</StateMessage>}
    </span>
  )
}
