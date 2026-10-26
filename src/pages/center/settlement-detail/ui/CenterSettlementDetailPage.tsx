import { Link, useParams } from 'react-router'
import {
  SettlementItemList,
  SettlementStatusTag,
  SettlementSummary,
  useSettlementQuery,
} from '@/entities/settlement'
import { getErrorMessage } from '@/shared/api'
import { sellerPathsOf } from '@/shared/config'
import { formatWon, useArea } from '@/shared/lib'
import { PageHeader } from '@/shared/ui/PageHeader'
import { ListSkeleton } from '@/shared/ui/Skeleton'
import { StateMessage } from '@/shared/ui/StateMessage'

/** 정산서 상세: 지급액 · 상태 → 계산(판매 금액 − 수수료 = 지급액) · 기간 · 입금 → 정산 항목 표 */
export function CenterSettlementDetailPage() {
  const { settlementId = '' } = useParams()
  const sellerPaths = sellerPathsOf(useArea())
  const query = useSettlementQuery(settlementId || null)
  const settlement = query.data

  return (
    <div className="shop-look space-y-6">
      <Link
        to={sellerPaths.settlements}
        className="text-ink-3 hover:text-ink inline-flex min-h-11 items-center gap-1 rounded-md text-[13px] font-semibold transition-colors"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        정산 목록
      </Link>
      <PageHeader
        title={`정산서 #${settlementId}`}
        step="⑦"
        note="정산이 실행되면 수수료 10%를 뺀 금액이 판매자 예치금으로 입금돼요(지급 완료)."
      />

      {query.isPending && <ListSkeleton rows={3} />}
      {query.isError && <StateMessage tone="error">{getErrorMessage(query.error)}</StateMessage>}
      {settlement && (
        <>
          {/* 지급액을 가장 크게, 그 아래 계산 · 기간 · 입금 */}
          <section
            aria-label="지급액"
            className="border-rule space-y-6 rounded-lg border p-5 md:p-6"
          >
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="space-y-1">
                <p className="text-ink-3 text-[13px]">지급액</p>
                <p className="figure text-ink text-[30px] leading-tight font-bold tracking-tight">
                  {formatWon(settlement.payoutAmount)}
                </p>
              </div>
              <SettlementStatusTag status={settlement.status} />
            </div>
            {settlement.failReason && (
              <p className="text-destructive text-sm">실패 사유: {settlement.failReason}</p>
            )}
            <SettlementSummary settlement={settlement} />
          </section>

          <section aria-label="정산 항목" className="space-y-3">
            <h2 className="text-section">
              정산 항목
              <span className="text-ink-3 figure ml-2 text-sm font-medium">
                {settlement.items.length}건
              </span>
            </h2>
            {settlement.items.length === 0 ? (
              <StateMessage>정산 항목이 없어요.</StateMessage>
            ) : (
              <SettlementItemList label="정산 항목" items={settlement.items} />
            )}
          </section>
        </>
      )}
    </div>
  )
}
