import { canRecoverSettlementRun, type SettlementRunResult } from '@/entities/settlement'
import { getErrorMessage } from '@/shared/api'
import { confirmAction } from '@/shared/lib'
import { useRecoverSettlementRun } from '../model/use-recover-settlement-run'

type RecoverSettlementRunButtonProps = { run: SettlementRunResult }

/** 실행 복구: 실행 중으로 남은 실행에만 보인다. 확인 창을 거치고, 요청 중에는 막는다 */
export function RecoverSettlementRunButton({ run }: RecoverSettlementRunButtonProps) {
  const recover = useRecoverSettlementRun()
  if (!canRecoverSettlementRun(run)) return null

  const handleRecover = async () => {
    const confirmed = await confirmAction({
      title: '실행을 실패로 정리할까요?',
      description: `실행 #${run.runId}을 실패로 정리해 같은 기준일로 다시 실행할 수 있게 해요. 실제로 도는 실행과 구분하지 못하니 서버를 다시 띄운 뒤에만 쓰세요.`,
      confirmLabel: '실행 복구',
    })
    if (confirmed) recover.mutate(run.runId)
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        className="text-ink-2 hover:text-ink inline-flex min-h-11 items-center text-[13px] font-semibold underline underline-offset-4 transition-colors disabled:opacity-50 lg:min-h-8"
        disabled={recover.isPending}
        aria-busy={recover.isPending}
        onClick={handleRecover}
      >
        실행 복구
      </button>
      {recover.isError && (
        <p role="alert" className="text-destructive text-xs">
          {getErrorMessage(recover.error)}
        </p>
      )}
    </div>
  )
}
