import { useState } from 'react'
import {
  useSettlementQuery,
  useSettlementsQuery,
  useSettlementTargetsQuery,
  type Settlement,
} from '@/entities/settlement'
import { useWalletQuery } from '@/entities/wallet'
import { getErrorMessage } from '@/shared/api'
import { formatDateTime, formatWon } from '@/shared/lib'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardTitle } from '@/shared/ui/card'
import { PageHeader, StateMessage } from '@/shared/ui/page-header'

export function SellerSettlementsPage() {
  const targets = useSettlementTargetsQuery()
  const settlements = useSettlementsQuery()
  const wallet = useWalletQuery()

  return (
    <div className="space-y-4">
      <PageHeader
        title="⑦ 정산 (판매자)"
        description="구매확정된 주문상품이 정산 대상이 되고, 정산하면 수수료 10%를 뺀 금액이 판매자 지갑에 적립돼요. (정산 API는 목)"
      />
      <Card>
        <p className="text-muted-foreground text-sm">내 예치금 지갑 (실제 API)</p>
        {wallet.data ? (
          <p className="text-xl font-bold">{formatWon(wallet.data.balance)}</p>
        ) : (
          <StateMessage tone={wallet.isError ? 'error' : 'muted'}>
            {wallet.isError ? getErrorMessage(wallet.error) : '불러오는 중…'}
          </StateMessage>
        )}
      </Card>
      <Card className="space-y-2">
        <CardTitle>정산 대상</CardTitle>
        {targets.isError && (
          <StateMessage tone="error">{getErrorMessage(targets.error)}</StateMessage>
        )}
        {targets.data?.length === 0 && <StateMessage>정산 대상이 없어요.</StateMessage>}
        {targets.data?.map((target) => (
          <div key={target.targetId} className="flex justify-between border-t pt-2 text-sm">
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
        <CardTitle>내 정산서</CardTitle>
        {settlements.isError && (
          <StateMessage tone="error">{getErrorMessage(settlements.error)}</StateMessage>
        )}
        {settlements.data?.content.length === 0 && <StateMessage>정산서가 없어요.</StateMessage>}
        {settlements.data?.content.map((settlement) => (
          <SettlementRow key={settlement.settlementId} settlement={settlement} />
        ))}
      </Card>
    </div>
  )
}

function SettlementRow({ settlement }: { settlement: Settlement }) {
  const [open, setOpen] = useState(false)
  const detail = useSettlementQuery(open ? settlement.settlementId : null)

  return (
    <div className="border-t pt-2 text-sm">
      <div className="flex items-center justify-between">
        <p className="font-medium">
          정산서 #{settlement.settlementId} · {settlement.period.periodEnd} 이전 구매확정분 ·{' '}
          {settlement.itemCount}건
        </p>
        <Button size="xs" variant="ghost" onClick={() => setOpen((value) => !value)}>
          {open ? '접기' : '상세'}
        </Button>
      </div>
      <p className="text-muted-foreground">
        판매 {formatWon(settlement.totalAmount)} − 수수료 {formatWon(settlement.feeAmount)} (
        {settlement.feeRate * 100}%) ={' '}
        <span className="text-foreground font-semibold">
          지급 {formatWon(settlement.payoutAmount)}
        </span>
      </p>
      {open && detail.isError && (
        <StateMessage tone="error">{getErrorMessage(detail.error)}</StateMessage>
      )}
      {open && detail.data && (
        <ul className="text-muted-foreground mt-1 list-disc pl-5 text-xs">
          {detail.data.items.map((item) => (
            <li key={item.orderItemId}>
              {item.productName} · {formatWon(item.amount)} · 구매확정{' '}
              {formatDateTime(item.confirmedAt)}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
