import { Link } from 'react-router'
import { getErrorMessage } from '@/shared/api'
import { formatWon } from '@/shared/lib'
import { StateMessage } from '@/shared/ui/page-header'
import { useConfirmCharge } from '../model/use-charge-wallet'

export function ConfirmCharge({ search }: { search: URLSearchParams }) {
  const confirm = useConfirmCharge(search)

  if (confirm.invalidRequest)
    return <StateMessage tone="error">승인에 필요한 값이 없어요.</StateMessage>
  if (confirm.isError)
    return <StateMessage tone="error">{getErrorMessage(confirm.error)}</StateMessage>
  if (!confirm.data) return <StateMessage>충전을 승인하는 중이에요…</StateMessage>
  return (
    <div className="space-y-2">
      <p>
        {formatWon(confirm.data.amount)} 충전했어요.
        {confirm.data.balance !== null && ` 잔액 ${formatWon(confirm.data.balance)}`}
      </p>
      <Link to="/wallet" className="text-primary underline">
        예치금으로 돌아가기
      </Link>
    </div>
  )
}
