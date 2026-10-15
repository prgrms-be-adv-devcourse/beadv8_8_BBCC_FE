import {
  canRetrySettlement,
  SETTLEMENT_STATUS_LABEL,
  useAdminSettlementsQuery,
} from '@/entities/settlement'
import { RetrySettlementButton } from '@/features/retry-settlement'
import { RunSettlementButton } from '@/features/run-settlement'
import { getErrorMessage } from '@/shared/api'
import { formatWon } from '@/shared/lib'
import { Badge } from '@/shared/ui/badge'
import { Card, CardTitle } from '@/shared/ui/card'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StateMessage } from '@/shared/ui/StateMessage'

export function AdminSettlementsPage() {
  const settlements = useAdminSettlementsQuery()

  return (
    <div className="space-y-4">
      <PageHeader
        mockEndpoints={['GET /admin/settlements', 'POST /admin/settlements/run']}
        title="정산"
        step="⑦"
        description="정산을 실행하고, 판매자별 정산 결과를 봐요. 지갑 적립에 실패한 정산은 재처리해요."
        note="원래는 매월 1일 자동 실행이에요. 시연에서는 수동으로 실행해요. (정산 API는 목)"
      />
      <Card>
        <RunSettlementButton />
      </Card>
      <Card className="space-y-2">
        <CardTitle>판매자별 정산</CardTitle>
        {settlements.isPending && <StateMessage>불러오는 중…</StateMessage>}
        {settlements.isError && (
          <StateMessage tone="error">{getErrorMessage(settlements.error)}</StateMessage>
        )}
        {settlements.data?.length === 0 && <StateMessage>정산이 없어요.</StateMessage>}
        {settlements.data?.map((settlement) => (
          <div
            key={settlement.id}
            className="flex flex-wrap items-center gap-3 border-t pt-2 text-sm"
          >
            <span className="font-medium">정산서 {settlement.id}</span>
            <span className="text-muted-foreground">판매자 {settlement.sellerId}</span>
            <span className="text-muted-foreground">{settlement.periodEnd} 이전 구매확정분</span>
            <span className="ml-auto">
              {formatWon(settlement.totalAmount)} − 수수료 {formatWon(settlement.feeAmount)} ={' '}
              <b>{formatWon(settlement.payoutAmount)}</b>
            </span>
            <Badge variant={settlement.status === 'COMPLETED' ? 'success' : 'destructive'}>
              {SETTLEMENT_STATUS_LABEL[settlement.status]}
            </Badge>
            {canRetrySettlement(settlement) && (
              <RetrySettlementButton settlementId={settlement.id} />
            )}
          </div>
        ))}
      </Card>
    </div>
  )
}
