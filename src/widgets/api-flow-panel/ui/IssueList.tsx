import type { ApiCallLog } from '@/shared/api'

const ISSUE_LABEL = {
  missing: '없음',
  type: '타입 다름',
  enum: '값 다름',
  extra: '추가 필드',
} as const

type IssueListProps = { log: ApiCallLog }

export function IssueList({ log }: IssueListProps) {
  return (
    <ul className="space-y-0.5">
      {log.contractIssues.map((issue) => (
        <li key={`${issue.path}-${issue.type}`} className="font-mono">
          <span className={issue.type === 'extra' ? 'text-muted-foreground' : 'text-destructive'}>
            [{ISSUE_LABEL[issue.type]}]
          </span>{' '}
          {issue.path} · 기대 {issue.expected} · 실제 {issue.actual}
        </li>
      ))}
    </ul>
  )
}
