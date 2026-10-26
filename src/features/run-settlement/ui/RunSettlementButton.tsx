import type { ReactNode } from 'react'
import { confirmAction } from '@/shared/lib'
import { SETTLEMENT_RUN_STATUS_LABEL } from '@/entities/settlement'
import { getErrorMessage } from '@/shared/api'
import { StateMessage } from '@/shared/ui/StateMessage'
import { settlementPeriodEnd } from '../lib/period-end'
import { useRunSettlement } from '../model/use-run-settlement'

/** 정산 실행: 기준일 · 대상 · 입금을 한 줄씩 보여 주고, 확인 창을 거쳐 실행한다 (요청 중에는 막는다) */
export function RunSettlementButton() {
  const run = useRunSettlement()
  const cutoffOn = settlementPeriodEnd(new Date())

  const handleRun = async () => {
    const confirmed = await confirmAction({
      title: '정산을 실행할까요?',
      description: `${cutoffOn} 0시 전(어제까지) 구매확정분을 판매자별로 정산하고 예치금으로 입금해요. 오늘 구매확정분은 내일 정산 대상이에요.`,
      confirmLabel: '정산 실행',
    })
    if (confirmed) run.mutate(cutoffOn)
  }

  return (
    <div className="space-y-4">
      <dl className="border-rule divide-rule divide-y rounded-lg border">
        <InfoRow label="기준일">
          <span className="figure">{cutoffOn}</span> (오늘)
        </InfoRow>
        <InfoRow label="정산 대상">
          어제까지 구매확정된 주문상품이에요. 오늘 구매확정분은 내일 정산돼요.
        </InfoRow>
        <InfoRow label="입금">판매자별로 정산해 판매자 예치금으로 입금해요.</InfoRow>
      </dl>
      <button
        type="button"
        className="shop-btn max-sm:w-full"
        disabled={run.isPending}
        aria-busy={run.isPending}
        onClick={handleRun}
      >
        정산 실행
      </button>
      {run.isError && <StateMessage tone="error">{getErrorMessage(run.error)}</StateMessage>}
      {run.data && (
        <p role="status" className="bg-paper-2 text-ink figure rounded-lg px-5 py-4 text-sm">
          정산 {SETTLEMENT_RUN_STATUS_LABEL[run.data.status] ?? run.data.status} · 성공{' '}
          {run.data.successCount} · 실패 {run.data.failCount} · 기간 {run.data.periodStart} ~{' '}
          {run.data.periodEnd}
        </p>
      )}
    </div>
  )
}

type InfoRowProps = { label: string; children: ReactNode }

function InfoRow({ label, children }: InfoRowProps) {
  return (
    <div className="flex min-h-14 items-center gap-4 px-5 py-3">
      <dt className="text-ink-3 w-20 shrink-0 text-sm">{label}</dt>
      <dd className="text-ink min-w-0 flex-1 text-sm">{children}</dd>
    </div>
  )
}
