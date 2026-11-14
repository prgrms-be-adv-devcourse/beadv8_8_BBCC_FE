import { Link } from 'react-router'
import { cn, useToastStore } from '@/shared/lib'

const MARK = { success: '✓', error: '!', info: 'i' }

/** toast()가 띄우는 짧은 알림. 화면 아래 가운데 (레이아웃마다 한 번 둔다) */
export function Toaster() {
  const toasts = useToastStore((state) => state.toasts)
  const dismiss = useToastStore((state) => state.dismiss)
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((item) => (
        <div
          key={item.id}
          className="bg-foreground rounded-pill pointer-events-auto flex max-w-md items-center gap-3 py-2.5 pr-3 pl-4 text-sm text-white shadow-xl"
        >
          <span
            aria-hidden
            data-slot="toast-mark"
            className={cn(
              'rounded-pill flex size-5 shrink-0 items-center justify-center text-xs font-bold',
              item.tone === 'error' ? 'bg-destructive' : 'bg-growth text-foreground',
            )}
          >
            {MARK[item.tone]}
          </span>
          <span>{item.message}</span>
          {item.action && (
            <Link
              to={item.action.href}
              onClick={() => dismiss(item.id)}
              className="text-highlight shrink-0 font-semibold underline"
            >
              {item.action.label}
            </Link>
          )}
        </div>
      ))}
    </div>
  )
}
