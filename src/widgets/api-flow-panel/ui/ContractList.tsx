import type { ApiCallLog } from '@/shared/api'
import { IssueList } from './IssueList'

type ContractListProps = { logs: ApiCallLog[] }

export function ContractList({ logs }: ContractListProps) {
  if (logs.length === 0) {
    return (
      <p className="text-muted-foreground p-2 text-xs">
        응답이 FE가 기대한 모양(DTO)과 다르면 여기에 쌓여요. 화면은 매퍼가 흡수해 그대로 동작해요.
      </p>
    )
  }
  return (
    <ol className="space-y-1">
      {[...logs].reverse().map((log) => (
        <li key={log.id} className="rounded-md border p-2 text-xs">
          <div className="mb-1 font-mono font-semibold">
            {log.method} {log.path}{' '}
            {log.mock && <span className="bg-highlight rounded px-1 font-sans">목</span>}
          </div>
          <IssueList log={log} />
        </li>
      ))}
    </ol>
  )
}
