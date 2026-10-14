import { useState } from 'react'
import {
  canCancelCharge,
  ChargeRow,
  recentChargeIds,
  useChargesQuery,
  useWalletQuery,
  WalletBalanceCard,
} from '@/entities/wallet'
import { CancelChargeButton } from '@/features/cancel-charge'
import { ChargeForm } from '@/features/charge-wallet'
import { getErrorMessage } from '@/shared/api'
import { Card, CardTitle } from '@/shared/ui/card'
import { PageHeader, StateMessage } from '@/shared/ui/page-header'

export function WalletPage() {
  const wallet = useWalletQuery()
  const [chargeIds] = useState(recentChargeIds)
  const charges = useChargesQuery(chargeIds)

  return (
    <div className="space-y-4">
      <PageHeader
        title="④ 예치금"
        description="주문은 예치금으로 자동 결제돼요. 충전은 토스 테스트 결제로 하고, 돌아오면 서버가 토스에 승인을 요청해요."
      />
      <WalletBalanceCard wallet={wallet.data} pending={wallet.isPending} error={wallet.error} />
      <ChargeForm />
      <Card className="space-y-2">
        <CardTitle>이번에 충전한 내역</CardTitle>
        <p className="text-muted-foreground text-xs">
          충전 내역 API가 아직 없어 이 탭에서 승인한 충전만 보여요. 충전 취소는 목이에요.
        </p>
        {chargeIds.length === 0 && <StateMessage>충전한 내역이 없어요.</StateMessage>}
        {charges.map((charge, index) =>
          charge.data ? (
            <ChargeRow
              key={chargeIds[index]}
              charge={charge.data}
              action={canCancelCharge(charge.data) && <CancelChargeButton charge={charge.data} />}
            />
          ) : (
            <StateMessage key={chargeIds[index]} tone={charge.isError ? 'error' : 'muted'}>
              {charge.isError ? getErrorMessage(charge.error) : '불러오는 중…'}
            </StateMessage>
          ),
        )}
      </Card>
    </div>
  )
}
