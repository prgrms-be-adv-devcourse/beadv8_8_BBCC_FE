import { useState } from 'react'
import {
  canHandleOrderDeadLetter,
  CLOSE_MEMO_MAX,
  closeMemoError,
  type OrderDeadLetter,
} from '@/entities/dead-letter'
import { getErrorMessage } from '@/shared/api'
import { cn, confirmAction } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { Textarea } from '@/shared/ui/input'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useHandleOrderDeadLetter } from '../model/use-handle-order-dead-letter'

type OrderDeadLetterActionsProps = { deadLetter: OrderDeadLetter }

/** 처리 대기일 때: 재처리 또는 메모를 남기고 확인 후 종료 (둘 다 확인 창 · 요청 중 막기). 결과 문구는 남긴다 */
export function OrderDeadLetterActions({ deadLetter }: OrderDeadLetterActionsProps) {
  const { reprocess, close } = useHandleOrderDeadLetter(deadLetter)
  const [memo, setMemo] = useState('')
  const [memoError, setMemoError] = useState<string | null>(null)
  const pending = reprocess.isPending || close.isPending
  const error = reprocess.error ?? close.error

  const handleReprocess = async () => {
    const confirmed = await confirmAction({
      title: '이 메시지를 다시 처리할까요?',
      description: '저장한 본문으로 원래 처리를 다시 실행해요. 다시 실패하면 처리 대기로 남아요.',
      confirmLabel: '재처리',
    })
    if (confirmed) reprocess.mutate()
  }

  const handleClose = async () => {
    const problem = closeMemoError(memo)
    setMemoError(problem)
    if (problem) return
    const confirmed = await confirmAction({
      title: '처리하지 않고 종료할까요?',
      description: '이 메시지는 다시 처리하지 않아요. 종료한 뒤에는 재처리할 수 없어요.',
      confirmLabel: '확인 후 종료',
    })
    if (confirmed) close.mutate(memo)
  }

  return (
    <div className="space-y-4">
      {canHandleOrderDeadLetter(deadLetter) && (
        <>
          <button
            type="button"
            className="shop-btn max-sm:w-full"
            disabled={pending}
            aria-busy={reprocess.isPending}
            onClick={handleReprocess}
          >
            재처리
          </button>
          <div className="space-y-2">
            <label htmlFor="close-memo" className="text-ink-2 block text-sm font-semibold">
              확인 후 종료 메모
            </label>
            <Textarea
              id="close-memo"
              value={memo}
              maxLength={CLOSE_MEMO_MAX}
              rows={3}
              onChange={(event) => setMemo(event.target.value)}
              placeholder="확인한 내용이나 처리하지 않는 이유"
              aria-invalid={memoError !== null}
              aria-describedby={memoError ? 'close-memo-error' : undefined}
            />
            {memoError && (
              <p id="close-memo-error" className="text-destructive text-[13px]">
                {memoError}
              </p>
            )}
            <Button
              variant="outline"
              className="h-10 rounded-md px-4 max-sm:w-full"
              disabled={pending}
              aria-busy={close.isPending}
              onClick={handleClose}
            >
              확인 후 종료
            </Button>
          </div>
        </>
      )}
      {error && <StateMessage tone="error">{getErrorMessage(error)}</StateMessage>}
      {reprocess.data && (
        <p
          role="status"
          className={cn(
            'bg-paper-2 rounded-lg px-5 py-4 text-sm break-all',
            reprocess.data.tone === 'error' ? 'text-destructive' : 'text-ink',
          )}
        >
          {reprocess.data.text}
        </p>
      )}
      {close.isSuccess && (
        <p role="status" className="bg-paper-2 text-ink rounded-lg px-5 py-4 text-sm">
          확인 후 종료했어요.
        </p>
      )}
    </div>
  )
}
