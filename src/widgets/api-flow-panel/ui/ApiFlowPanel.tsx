import { useMemo, useState, type ReactNode } from 'react'
import { isFailedCall, useApiFlowLog } from '@/shared/api'
import { cn } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { buildReport, downloadText } from '../lib/report'
import { latestActionDomains } from '../model/flow-view'
import { deriveStateChanges } from '../model/state-changes'
import { CallList } from './CallList'
import { ChangeList } from './ChangeList'
import { ContractList } from './ContractList'
import { DomainFlowMap } from './DomainFlowMap'
import { MockSettings } from './MockSettings'

type Tab = 'calls' | 'changes' | 'contract' | 'mock'

/** 화면에서 일어난 API 호출, 그 뒤 서버에서 이어지는 처리, 서버 상태 변화, 계약 불일치를 보여 준다 */
export function ApiFlowPanel() {
  const logs = useApiFlowLog((state) => state.logs)
  const clear = useApiFlowLog((state) => state.clear)
  const [tab, setTab] = useState<Tab>('calls')
  const { called, followed } = latestActionDomains(logs)
  const changes = useMemo(() => deriveStateChanges(logs), [logs])
  const contractLogs = logs.filter((log) => log.contractIssues.length > 0)
  // 백엔드가 필드를 더한 것(extra)은 깨지지 않으므로 따로 센다
  const contractErrorCount = logs.filter((log) =>
    log.contractIssues.some((issue) => issue.type !== 'extra'),
  ).length
  const failedCount = logs.filter(isFailedCall).length

  const exportReport = () => {
    const report = buildReport(logs, changes)
    void navigator.clipboard?.writeText(report).catch(() => undefined)
    downloadText(
      `kidly-확인기록-${new Date().toISOString().slice(0, 16).replace(':', '')}.md`,
      report,
    )
  }

  return (
    <aside className="flex h-full min-h-0 flex-col border-l bg-white">
      <div className="space-y-2 border-b p-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">도메인 흐름</h2>
          <span className="text-muted-foreground text-[11px]">■ 호출 □ 서버 이벤트로 이어짐</span>
        </div>
        <DomainFlowMap called={called} followed={followed} />
      </div>
      <div className="flex flex-wrap items-center gap-1 border-b px-2 py-1.5 text-xs">
        <TabButton active={tab === 'calls'} onClick={() => setTab('calls')}>
          호출 {logs.length}
          {failedCount > 0 && <span className="text-destructive"> · 실패 {failedCount}</span>}
        </TabButton>
        <TabButton active={tab === 'changes'} onClick={() => setTab('changes')}>
          상태 변화 {changes.filter((change) => change.from !== null).length}
        </TabButton>
        <TabButton active={tab === 'contract'} onClick={() => setTab('contract')}>
          <span className={cn(contractErrorCount > 0 && 'text-destructive')}>
            계약 {contractErrorCount}
            {contractLogs.length > contractErrorCount &&
              ` (+추가 ${contractLogs.length - contractErrorCount})`}
          </span>
        </TabButton>
        <TabButton active={tab === 'mock'} onClick={() => setTab('mock')}>
          목 설정
        </TabButton>
        <div className="ml-auto flex gap-1">
          <Button size="xs" variant="ghost" onClick={exportReport} disabled={logs.length === 0}>
            기록 내보내기
          </Button>
          <Button size="xs" variant="ghost" onClick={clear}>
            지우기
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {tab === 'calls' && <CallList logs={logs} />}
        {tab === 'changes' && <ChangeList changes={changes} />}
        {tab === 'contract' && <ContractList logs={contractLogs} />}
        {tab === 'mock' && <MockSettings />}
      </div>
    </aside>
  )
}

type TabButtonProps = {
  active: boolean
  onClick: () => void
  children: ReactNode
}

function TabButton({ active, onClick, children }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded px-2 py-1',
        active ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted',
      )}
    >
      {children}
    </button>
  )
}
