import { RunSettlementButton } from '@/features/run-settlement'
import { PageHeader } from '@/shared/ui/PageHeader'

export function AdminSettlementsPage() {
  return (
    <div className="shop-look max-w-2xl space-y-6">
      <PageHeader
        title="정산"
        step="⑦"
        description="정산을 실행해요. 판매자별 정산서는 판매자 정산 화면에서 봐요."
        note="원래는 매월 1일 자동 실행이에요. 시연에서는 수동으로 실행해요. 정산이 끝나면 결제 도메인이 판매자 예치금에 입금해요."
      />
      <section aria-label="정산 실행" className="space-y-3">
        <h2 className="text-section">정산 실행</h2>
        <RunSettlementButton />
      </section>
    </div>
  )
}
