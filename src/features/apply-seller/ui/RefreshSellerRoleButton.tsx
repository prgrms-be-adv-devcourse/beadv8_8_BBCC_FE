import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useRefreshSellerRole } from '../model/use-apply-seller'

export function RefreshSellerRoleButton() {
  const refresh = useRefreshSellerRole()
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        className="h-10 px-4 text-sm"
        disabled={refresh.isPending}
        onClick={() => refresh.mutate()}
      >
        판매자 역할 받기 (토큰 재발급)
      </Button>
      {refresh.isError && (
        <StateMessage tone="error">{getErrorMessage(refresh.error)}</StateMessage>
      )}
    </div>
  )
}
