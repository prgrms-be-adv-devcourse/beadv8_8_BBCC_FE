import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useGrantAdmin } from '../model/use-manage-admin-role'

type GrantAdminButtonProps = { memberId: string }

export function GrantAdminButton({ memberId }: GrantAdminButtonProps) {
  const grant = useGrantAdmin(memberId)
  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="outline" disabled={grant.isPending} onClick={() => grant.mutate()}>
        관리자 지정
      </Button>
      {grant.isError && <StateMessage tone="error">{getErrorMessage(grant.error)}</StateMessage>}
    </div>
  )
}
