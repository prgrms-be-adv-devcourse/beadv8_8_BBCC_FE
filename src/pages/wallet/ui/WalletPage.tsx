import { useWalletQuery } from '@/entities/wallet'
import { ChargeForm } from '@/features/charge-wallet'
import { getErrorMessage } from '@/shared/api'
import { formatWon } from '@/shared/lib'
import { Card } from '@/shared/ui/card'
import { PageHeader, StateMessage } from '@/shared/ui/page-header'

export function WalletPage() {
  const wallet = useWalletQuery()

  return (
    <div className="space-y-4">
      <PageHeader
        title="④ 예치금"
        description="주문은 예치금으로 자동 결제돼요. 충전은 토스 테스트 결제로 하고, 돌아오면 서버가 토스에 승인을 요청해요."
      />
      <Card>
        <p className="text-muted-foreground text-sm">잔액</p>
        {wallet.isPending && <StateMessage>불러오는 중…</StateMessage>}
        {wallet.isError && (
          <StateMessage tone="error">{getErrorMessage(wallet.error)}</StateMessage>
        )}
        {wallet.data && <p className="text-2xl font-bold">{formatWon(wallet.data.balance)}</p>}
      </Card>
      <ChargeForm />
    </div>
  )
}
