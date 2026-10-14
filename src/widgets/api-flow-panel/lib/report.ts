import type { ApiCallLog } from '@/shared/api'
import type { StateChange } from '../model/state-changes'

function problemDetail(body: unknown): string | null {
  if (typeof body === 'object' && body !== null && 'detail' in body) {
    const { title, detail } = body as { title?: string; detail?: string }
    return `${title ?? ''} — ${detail ?? ''}`
  }
  return null
}

/** 담당자에게 그대로 붙여 넣을 수 있는 마크다운 기록 */
export function buildReport(logs: ApiCallLog[], changes: StateChange[]): string {
  const lines: string[] = [`# Kidly 통합 확인 기록 (${new Date().toLocaleString('ko-KR')})`, '']
  const failed = logs.filter((log) => log.status === null || log.status >= 400)
  const contract = logs.filter((log) => log.contractIssues.length > 0)
  lines.push(
    `- 호출 ${logs.length}건 · 실패 ${failed.length}건 · 계약 불일치 ${contract.length}건`,
    '',
  )

  lines.push('## 상태 변화', '')
  for (const change of changes) {
    const elapsed = change.elapsedMs !== null ? ` (${(change.elapsedMs / 1000).toFixed(1)}초)` : ''
    lines.push(`- ${change.resource}: ${change.from ?? '처음'} → ${change.to}${elapsed}`)
  }

  lines.push('', '## 실패한 호출', '')
  for (const log of failed) {
    lines.push(
      `### ${log.method} ${log.path} → ${log.status ?? '응답 없음'}`,
      `- 행동: ${log.action ?? '-'} · 회원: ${log.actor ?? '-'} · ${log.startedAt}`,
      `- 오류: ${problemDetail(log.responseBody) ?? '-'}`,
      '```json',
      JSON.stringify({ request: log.requestBody, response: log.responseBody }, null, 2),
      '```',
      '',
    )
  }

  lines.push('## 계약 불일치', '')
  for (const log of contract) {
    lines.push(`### ${log.method} ${log.path}${log.mock ? ' (목)' : ''}`)
    for (const issue of log.contractIssues) {
      lines.push(`- \`${issue.path}\` ${issue.type}: 기대 ${issue.expected} / 실제 ${issue.actual}`)
    }
    lines.push('')
  }

  lines.push('## 전체 호출 순서', '')
  for (const log of logs) {
    lines.push(
      `- ${log.startedAt.slice(11, 19)} ${log.method} ${log.path} ${log.status ?? '실패'}${log.mock ? ' (목)' : ''}${log.action ? ` — ${log.action}` : ''}`,
    )
  }
  return lines.join('\n')
}

export function downloadText(fileName: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown' }))
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}
