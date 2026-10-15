import { RunSettlementButton } from '@/features/run-settlement'
import { Card } from '@/shared/ui/card'
import { PageHeader } from '@/shared/ui/PageHeader'

export function AdminSettlementsPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="정산"
        step="⑦"
        description="정산을 실행해요. 판매자별 정산서는 판매자 정산 화면에서 봐요."
        note="원래는 매월 1일 자동 실행이에요. 시연에서는 수동으로 실행해요. 정산이 끝나면 결제 도메인이 판매자 예치금에 입금해요."
      />
      <Card>
        <RunSettlementButton />
      </Card>
    </div>
  )
}
