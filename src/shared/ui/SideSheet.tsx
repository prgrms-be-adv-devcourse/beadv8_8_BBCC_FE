import { useEffect, type ReactNode } from 'react'

type SideSheetProps = { title: string; open: boolean; onClose: () => void; children: ReactNode }

/** 오른쪽에서 열리는 상세 서랍. Esc · 바깥을 누르면 닫힌다 */
export function SideSheet({ title, open, onClose, children }: SideSheetProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/30" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        className="h-full w-full max-w-md space-y-4 overflow-y-auto bg-white p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="hover:bg-muted rounded-full px-2 py-1"
          >
            ✕
          </button>
        </div>
        {children}
      </aside>
    </div>
  )
}
