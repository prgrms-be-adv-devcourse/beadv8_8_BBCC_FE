import { getErrorMessage } from '@/shared/api'
import { formatWon } from '@/shared/lib'
import { Card } from '@/shared/ui/card'
import { StateMessage } from '@/shared/ui/page-header'
import type { Wallet } from '../model/wallet'

type Props = {
  title?: string
  wallet: Wallet | undefined
  pending: boolean
  error: unknown
}

export function WalletBalanceCard({ title = '잔액', wallet, pending, error }: Props) {
  return (
    <Card>
      <p className="text-muted-foreground text-sm">{title}</p>
      {pending && <StateMessage>불러오는 중…</StateMessage>}
      {Boolean(error) && <StateMessage tone="error">{getErrorMessage(error)}</StateMessage>}
      {wallet && <p className="text-2xl font-bold">{formatWon(wallet.balance)}</p>}
    </Card>
  )
}
