import { isFailedCall, type ApiCallLog } from '@/shared/api'
import { cn } from '@/shared/lib'
import { summarizeResponse } from '../model/call-groups'

type LatestCallCardProps = { log: ApiCallLog; onOpen: () => void }

/** "방금 호출": 마지막 행동 호출(실패면 실패)을 크게 */
export function LatestCallCard({ log, onOpen }: LatestCallCardProps) {
  const failed = isFailedCall(log)
  const summary = summarizeResponse(log.responseBody)
  return (
    <section
      aria-label="방금 호출"
      className={cn(
        'space-y-1.5 rounded-xl border-2 p-3',
        failed ? 'border-destructive/60 bg-destructive/5' : 'border-primary/30 bg-primary-soft/60',
      )}
    >
      <div className="text-muted-foreground flex items-center gap-2 text-xs">
        <span className="font-semibold">방금 호출</span>
        {log.step && <span>{log.step}</span>}
        {log.action && <span className="truncate">{log.action.replace(/^자동 시연 · /, '')}</span>}
        <span className="ml-auto">{log.actor ? `회원 ${log.actor}` : '토큰 없음'}</span>
      </div>
      <p className="flex items-baseline gap-2 font-mono">
        <span className="text-base font-bold">{log.method}</span>
        <span className="min-w-0 flex-1 truncate text-base">{log.path}</span>
        <span
          className={cn('text-xl font-extrabold', failed ? 'text-destructive' : 'text-green-700')}
        >
          {log.status ?? '실패'}
        </span>
        <span className="text-muted-foreground text-xs">{log.durationMs}ms</span>
      </p>
      {summary.length > 0 && (
        <p className={cn('text-sm', failed ? 'text-destructive font-medium' : 'text-foreground')}>
          {summary.join(' · ')}
        </p>
      )}
      <button type="button" onClick={onOpen} className="text-primary text-xs underline">
        요청 · 응답 보기
      </button>
    </section>
  )
}
