import { RunSettlementButton } from '@/features/run-settlement'
import { Card } from '@/shared/ui/card'
import { PageHeader } from '@/shared/ui/page-header'

export function AdminSettlementsPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="정산 실행"
        step="⑦"
        note="원래는 매월 1일 자동 실행이에요. 시연에서는 수동으로 실행해요. (정산 API는 목)"
      />
      <Card>
        <RunSettlementButton />
      </Card>
    </div>
  )
}
