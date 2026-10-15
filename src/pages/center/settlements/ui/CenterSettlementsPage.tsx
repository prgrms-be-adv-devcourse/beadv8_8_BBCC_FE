import { useState } from 'react'
import {
  SettlementItemList,
  SettlementSummary,
  useSettlementQuery,
  useSettlementsQuery,
  useSettlementTargetsQuery,
  type Settlement,
} from '@/entities/settlement'
import { useWalletQuery, WalletBalanceCard } from '@/entities/wallet'
import { getErrorMessage } from '@/shared/api'
import { formatDateTime, formatWon } from '@/shared/lib'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardTitle } from '@/shared/ui/card'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StateMessage } from '@/shared/ui/StateMessage'
import { MockBadge } from '@/shared/ui/MockBadge'

export function CenterSettlementsPage() {
  const targets = useSettlementTargetsQuery()
  const settlements = useSettlementsQuery()
  const wallet = useWalletQuery()

  return (
    <div className="space-y-4">
      <PageHeader
        title="정산"
        step="⑦"
        description="구매확정된 판매 금액에서 수수료를 빼고 예치금으로 입금돼요."
        note="구매확정된 주문상품이 정산 대상이 되고, 정산하면 수수료 10%를 뺀 금액이 판매자 예치금으로 입금돼요. 정산 API는 아직 목이라 정산서는 보이지만, 예치금 잔액 · 입출금 내역에는 백엔드 정산 API가 생겨야 반영돼요."
      />
      <WalletBalanceCard
        title="내 예치금 지갑 (실제 API · 정산 입금은 아직 반영 안 됨)"
        wallet={wallet.data}
        pending={wallet.isPending}
        error={wallet.error}
      />
      <Card className="space-y-2">
        <CardTitle>
          정산 대상
          <MockBadge endpoints={['GET /seller/settlement-targets']} />
        </CardTitle>
        {targets.isError && (
          <StateMessage tone="error">{getErrorMessage(targets.error)}</StateMessage>
        )}
        {targets.data?.length === 0 && <StateMessage>정산 대상이 없어요.</StateMessage>}
        {targets.data?.map((target) => (
          <div key={target.id} className="flex justify-between border-t pt-2 text-sm">
            <span>
              {target.productName} · 구매확정 {formatDateTime(target.confirmedAt)}
            </span>
            <span>
              {formatWon(target.amount)}{' '}
              <Badge variant={target.settled ? 'success' : 'muted'}>
                {target.settled ? '정산됨' : '미정산'}
              </Badge>
            </span>
          </div>
        ))}
      </Card>
      <Card className="space-y-2">
        <CardTitle>
          내 정산서
          <MockBadge endpoints={['GET /seller/settlements']} />
        </CardTitle>
        {settlements.isError && (
          <StateMessage tone="error">{getErrorMessage(settlements.error)}</StateMessage>
        )}
        {settlements.data?.content.length === 0 && <StateMessage>정산서가 없어요.</StateMessage>}
        {settlements.data?.content.map((settlement) => (
          <SettlementRow key={settlement.id} settlement={settlement} />
        ))}
      </Card>
    </div>
  )
}

type SettlementRowProps = { settlement: Settlement }

/** 펼치면 정산서 상세를 조회한다 */
function SettlementRow({ settlement }: SettlementRowProps) {
  const [open, setOpen] = useState(false)
  const detail = useSettlementQuery(open ? settlement.id : null)

  return (
    <div className="border-t pt-2">
      <SettlementSummary
        settlement={settlement}
        action={
          <Button size="xs" variant="ghost" onClick={() => setOpen((value) => !value)}>
            {open ? '접기' : '상세'}
          </Button>
        }
      />
      {open && detail.isError && (
        <StateMessage tone="error">{getErrorMessage(detail.error)}</StateMessage>
      )}
      {open && detail.data && <SettlementItemList items={detail.data.items} />}
    </div>
  )
}
