import { canReprocess, type DeadLetter, type DeadLetterModule } from '@/entities/dead-letter'
import { getErrorMessage } from '@/shared/api'
import { cn, confirmAction } from '@/shared/lib'
import { StateMessage } from '@/shared/ui/StateMessage'
import { reprocessOutcomeText } from '../model/outcome-text'
import { useReprocessDeadLetter } from '../model/use-reprocess-dead-letter'

type ReprocessDeadLetterButtonProps = { module: DeadLetterModule; deadLetter: DeadLetter }

/** 재처리: 확인 창을 거쳐 실행한다 (요청 중에는 막는다). 재처리 완료가 되면 버튼은 사라지고 결과 문구만 남는다 */
export function ReprocessDeadLetterButton({ module, deadLetter }: ReprocessDeadLetterButtonProps) {
  const reprocess = useReprocessDeadLetter(module)
  const outcome = reprocess.data && reprocessOutcomeText(reprocess.data)

  const handleReprocess = async () => {
    const confirmed = await confirmAction({
      title: '이 메시지를 다시 처리할까요?',
      description: '보관한 메시지를 처리기에 다시 넣어요. 다시 실패하면 처리 대기로 남아요.',
      confirmLabel: '재처리',
    })
    if (confirmed) reprocess.mutate(deadLetter)
  }

  return (
    <div className="space-y-3">
      {canReprocess(deadLetter) && (
        <button
          type="button"
          className="shop-btn max-sm:w-full"
          disabled={reprocess.isPending}
          aria-busy={reprocess.isPending}
          onClick={handleReprocess}
        >
          재처리
        </button>
      )}
      {reprocess.isError && (
        <StateMessage tone="error">{getErrorMessage(reprocess.error)}</StateMessage>
      )}
      {outcome && (
        <p
          role="status"
          className={cn(
            'bg-paper-2 rounded-lg px-5 py-4 text-sm break-all',
            outcome.tone === 'error' ? 'text-destructive' : 'text-ink',
          )}
        >
          {outcome.text}
        </p>
      )}
    </div>
  )
}
