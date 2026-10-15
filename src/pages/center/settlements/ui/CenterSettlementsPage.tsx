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
import { Button } from '@/shared/ui/button'
import { Card, CardTitle } from '@/shared/ui/card'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StateMessage } from '@/shared/ui/StateMessage'

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
        note="구매확정된 주문상품이 정산 대상으로 쌓이고, 정산이 실행되면 수수료 10%를 뺀 금액이 판매자 예치금으로 입금돼요(지급 완료)."
      />
      <WalletBalanceCard
        title="내 예치금 지갑"
        wallet={wallet.data}
        pending={wallet.isPending}
        error={wallet.error}
      />
      <Card className="space-y-2">
        <CardTitle>정산 대상 (아직 정산 안 된 구매확정분)</CardTitle>
        {targets.isError && (
          <StateMessage tone="error">{getErrorMessage(targets.error)}</StateMessage>
        )}
        {targets.data?.content.length === 0 && <StateMessage>정산 대상이 없어요.</StateMessage>}
        {targets.data?.content.map((target) => (
          <div key={target.orderItemId} className="flex justify-between border-t pt-2 text-sm">
            <span>
              주문 #{target.orderId} · 주문상품 #{target.orderItemId} · 구매확정{' '}
              {formatDateTime(target.confirmedAt)}
            </span>
            <span>{formatWon(target.amount)}</span>
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
      {open && detail.data?.failReason && (
        <StateMessage tone="error">실패 사유: {detail.data.failReason}</StateMessage>
      )}
      {open && detail.data && <SettlementItemList items={detail.data.items} />}
    </div>
  )
}
