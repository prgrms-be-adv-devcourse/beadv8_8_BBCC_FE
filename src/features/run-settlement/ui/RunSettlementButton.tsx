import { confirmAction } from '@/shared/lib'
import { SETTLEMENT_RUN_STATUS_LABEL } from '@/entities/settlement'
import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/StateMessage'
import { settlementPeriodEnd } from '../lib/period-end'
import { useRunSettlement } from '../model/use-run-settlement'

export function RunSettlementButton() {
  const run = useRunSettlement()

  return (
    <div className="space-y-2">
      <Button
        disabled={run.isPending}
        onClick={async () => {
          const cutoffOn = settlementPeriodEnd(new Date())
          if (
            await confirmAction({
              title: '정산을 실행할까요?',
              description: `${cutoffOn} 0시 전(어제까지) 구매확정분을 판매자별로 정산하고 예치금으로 입금해요. 오늘 구매확정분은 내일 정산 대상이에요.`,
              confirmLabel: '정산 실행',
            })
          ) {
            run.mutate(cutoffOn)
          }
        }}
      >
        정산 실행
      </Button>
      <p className="text-muted-foreground text-xs">
        기준일은 오늘이에요. 어제까지 구매확정된 주문상품이 대상이고, 오늘 구매확정분은 내일
        정산돼요.
      </p>
      {run.isError && <StateMessage tone="error">{getErrorMessage(run.error)}</StateMessage>}
      {run.data && (
        <StateMessage>
          정산 {SETTLEMENT_RUN_STATUS_LABEL[run.data.status] ?? run.data.status} · 성공{' '}
          {run.data.successCount} · 실패 {run.data.failCount} · 기간 {run.data.periodStart} ~{' '}
          {run.data.periodEnd}
        </StateMessage>
      )}
    </div>
  )
}
