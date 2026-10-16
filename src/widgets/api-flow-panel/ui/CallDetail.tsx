import type { ApiCallLog } from '@/shared/api'
import { cn } from '@/shared/lib'
import { followingSteps } from '../model/flow-view'
import { statusColor } from '../model/status-color'
import { FlowSteps, JsonBlock } from './call-parts'
import { IssueList } from './IssueList'

type CallDetailProps = { log: ApiCallLog; onClose: () => void }

/** 목록에서 고른 호출 1건의 상세 (방금 호출 카드 자리에) */
export function CallDetail({ log, onClose }: CallDetailProps) {
  const steps = followingSteps(log)
  return (
    <section
      aria-label="선택한 호출"
      className="border-primary space-y-2 rounded-xl border-2 bg-white p-3 text-xs"
    >
      <div className="text-muted-foreground flex items-center gap-2">
        <span className="font-semibold">선택한 호출</span>
        {log.step && <span>{log.step}</span>}
        {log.action && <span className="truncate">{log.action.replace(/^자동 시연 · /, '')}</span>}
        <button
          type="button"
          onClick={onClose}
          className="hover:bg-muted ml-auto rounded border px-2 py-0.5"
          title="닫기 (Esc)"
        >
          ✕ 닫기
        </button>
      </div>
      <p className="flex items-baseline gap-2 font-mono">
        <span className="text-sm font-bold">{log.method}</span>
        <span className="min-w-0 flex-1 text-sm break-all">{log.path}</span>
        <span
          className={cn(
            'text-lg font-extrabold',
            log.expectedReason ? 'text-muted-foreground' : statusColor(log.status),
          )}
        >
          {log.status ?? '실패'}
        </span>
      </p>
      <p className="text-muted-foreground flex flex-wrap gap-x-2">
        <span>{log.durationMs}ms</span>
        <span>{log.actor ? `회원 ${log.actor}` : '토큰 없음'}</span>
        <span>{new Date(log.startedAt).toLocaleTimeString('ko-KR')}</span>
        {log.mock && <span className="bg-highlight text-foreground rounded px-1">목 응답</span>}
        {log.expectedReason && <span>예상된 응답 · {log.expectedReason}</span>}
      </p>
      {log.contractIssues.length > 0 ? (
        <div>
          <div className="text-muted-foreground">계약</div>
          <IssueList log={log} />
        </div>
      ) : (
        <p>
          <span className="text-muted-foreground">계약</span> ✓ 맞음
        </p>
      )}
      <JsonBlock label="요청" value={log.requestBody} />
      <JsonBlock label="응답" value={log.responseBody} />
      {steps.length > 0 && <FlowSteps steps={steps} />}
    </section>
  )
}
