import { useState } from 'react'
import {
  CHARGE_STATUS_LABEL,
  recentChargeIds,
  useChargesQuery,
  useWalletQuery,
} from '@/entities/wallet'
import { CancelChargeButton } from '@/features/cancel-charge'
import { ChargeForm } from '@/features/charge-wallet'
import { getErrorMessage } from '@/shared/api'
import { formatDateTime, formatWon } from '@/shared/lib'
import { Badge } from '@/shared/ui/badge'
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
      <Card>
        <p className="text-muted-foreground text-sm">잔액</p>
        {wallet.isPending && <StateMessage>불러오는 중…</StateMessage>}
        {wallet.isError && (
          <StateMessage tone="error">{getErrorMessage(wallet.error)}</StateMessage>
        )}
        {wallet.data && <p className="text-2xl font-bold">{formatWon(wallet.data.balance)}</p>}
      </Card>
      <ChargeForm />
      <Card className="space-y-2">
        <CardTitle>이번에 충전한 내역</CardTitle>
        <p className="text-muted-foreground text-xs">
          충전 내역 API가 아직 없어 이 탭에서 승인한 충전만 보여요. 충전 취소는 목이에요.
        </p>
        {chargeIds.length === 0 && <StateMessage>충전한 내역이 없어요.</StateMessage>}
        {charges.map((charge, index) => (
          <div
            key={chargeIds[index]}
            className="flex items-center justify-between border-t pt-2 text-sm"
          >
            {charge.data ? (
              <>
                <span>
                  충전 #{charge.data.chargeId} · {formatWon(charge.data.amount)} ·{' '}
                  {formatDateTime(charge.data.approvedAt)}{' '}
                  <Badge variant={charge.data.status === 'DONE' ? 'success' : 'muted'}>
                    {CHARGE_STATUS_LABEL[charge.data.status]}
                  </Badge>
                </span>
                {charge.data.status === 'DONE' && <CancelChargeButton charge={charge.data} />}
              </>
            ) : (
              <StateMessage tone={charge.isError ? 'error' : 'muted'}>
                {charge.isError ? getErrorMessage(charge.error) : '불러오는 중…'}
              </StateMessage>
            )}
          </div>
        ))}
      </Card>
    </div>
  )
}
