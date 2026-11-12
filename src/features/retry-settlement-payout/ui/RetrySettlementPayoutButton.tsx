import { canRetrySettlementPayout, type AdminSettlement } from '@/entities/settlement'
import { getErrorMessage } from '@/shared/api'
import { confirmAction, formatWon } from '@/shared/lib'
import { useRetrySettlementPayout } from '../model/use-retry-settlement-payout'

type RetrySettlementPayoutButtonProps = { settlement: AdminSettlement }

/** 지급 재요청: 지급 결과를 받지 못한 정산서에만 보인다. 확인 창을 거치고, 요청 중에는 막는다 */
export function RetrySettlementPayoutButton({ settlement }: RetrySettlementPayoutButtonProps) {
  const retry = useRetrySettlementPayout()
  if (!canRetrySettlementPayout(settlement)) return null

  const handleRetry = async () => {
    const confirmed = await confirmAction({
      title: '지급을 다시 요청할까요?',
      description: `정산서 #${settlement.id}의 ${formatWon(settlement.payoutAmount)}을 판매자 #${settlement.sellerId} 예치금으로 다시 요청해요. 같은 정산서라 두 번 입금되지 않아요.`,
      confirmLabel: '지급 재요청',
    })
    if (confirmed) retry.mutate(settlement.id)
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        className="text-ink-2 hover:text-ink inline-flex min-h-11 items-center text-[13px] font-semibold underline underline-offset-4 transition-colors disabled:opacity-50 lg:min-h-8"
        disabled={retry.isPending}
        aria-busy={retry.isPending}
        onClick={handleRetry}
      >
        지급 재요청
      </button>
      {retry.isError && (
        <p role="alert" className="text-destructive text-xs">
          {getErrorMessage(retry.error)}
        </p>
      )}
      {retry.isSuccess && (
        <p role="status" className="text-ink-3 text-xs">
          요청했어요
        </p>
      )}
    </div>
  )
}
