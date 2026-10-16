import { useEffect, useRef } from 'react'
import { cn, useConfirmStore } from '@/shared/lib'

/** confirmAction()이 여는 확인 모달. 레이아웃마다 한 번 둔다 */
export function ConfirmHost() {
  const current = useConfirmStore((state) => state.current)
  const close = useConfirmStore((state) => state.close)
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!current) return
    confirmRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [current, close])

  if (!current) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      onClick={() => close(false)}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby={current.description ? 'confirm-description' : undefined}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-2xl"
      >
        <h2 id="confirm-title" className="text-lg font-bold">
          {current.title}
        </h2>
        {current.description && (
          <p id="confirm-description" className="text-muted-foreground text-sm whitespace-pre-line">
            {current.description}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => close(false)}
            className="rounded-full border px-4 py-2 text-sm"
          >
            취소
          </button>
          <button
            ref={confirmRef}
            type="button"
            data-confirm
            onClick={() => close(true)}
            className={cn(
              'rounded-full px-5 py-2 text-sm font-semibold',
              current.tone === 'danger'
                ? 'bg-destructive text-white'
                : 'bg-primary text-primary-foreground',
            )}
          >
            {current.confirmLabel ?? '확인'}
          </button>
        </div>
      </div>
    </div>
  )
}
