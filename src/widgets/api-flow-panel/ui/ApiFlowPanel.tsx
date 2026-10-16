import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { isFailedCall, useApiFlowLog } from '@/shared/api'
import { cn } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { buildReport, downloadText } from '../lib/report'
import { domainOf } from '../config/domain-flow'
import { latestTimeline } from '../model/event-timeline'
import { spotlightCall } from '../model/call-groups'
import { SPLIT_MIN_PX, usePanelSize, type PanelSize } from '../model/panel-size'
import { isKeyCall, usePresentationMode } from '../model/presentation-mode'
import { deriveStateChanges } from '../model/state-changes'
import { CallList } from './CallList'
import { ChangeList } from './ChangeList'
import { ContractList } from './ContractList'
import { EventFlowDiagram } from './EventFlowDiagram'
import { CallDetail } from './CallDetail'
import { LatestCallCard } from './LatestCallCard'
import { MockSettings } from './MockSettings'

type Tab = 'calls' | 'changes' | 'contract' | 'mock'

type ApiFlowPanelProps = {
  /** 쇼핑 화면 흐름 서랍 안: 폭 버튼 없이 위아래로만 */
  inDrawer?: boolean
}

/**
 * 화면에서 일어난 API 호출, 그 뒤 서버에서 이어지는 처리, 서버 상태 변화, 계약 불일치를 보여 준다.
 * 넓게 · 전체 폭에서는 왼쪽에 호출 목록, 오른쪽에 방금 호출(또는 고른 호출 상세) + 서버 이벤트 흐름도.
 */
export function ApiFlowPanel({ inDrawer = false }: ApiFlowPanelProps) {
  const logs = useApiFlowLog((state) => state.logs)
  const clear = useApiFlowLog((state) => state.clear)
  const [tab, setTab] = useState<Tab>('calls')
  const timeline = useMemo(() => latestTimeline(logs, domainOf), [logs])
  const presentation = usePresentationMode((state) => state.on)
  const togglePresentation = usePresentationMode((state) => state.toggle)
  const visibleLogs = presentation ? logs.filter(isKeyCall) : logs
  const changes = useMemo(() => deriveStateChanges(logs), [logs])
  const contractLogs = logs.filter((log) => log.contractIssues.length > 0)
  // 백엔드가 필드를 더한 것(extra)은 깨지지 않으므로 따로 센다
  const contractErrorCount = logs.filter((log) =>
    log.contractIssues.some((issue) => issue.type !== 'extra'),
  ).length
  const failedCount = logs.filter(isFailedCall).length
  const selectedLogId = useApiFlowLog((state) => state.focusedLogId)
  const focusLog = useApiFlowLog((state) => state.focusLog)
  const { size, setSize, widenForDetail, restoreAfterDetail } = usePanelSize()
  const [diagramOpen, setDiagramOpen] = useState(false)
  const spotlight = spotlightCall(logs, isKeyCall)
  const selected = logs.find((log) => log.id === selectedLogId) ?? null
  const [panelWidth, setPanelWidth] = useState(0)
  // 패널 실제 폭을 따라간다 (손잡이로 맞춘 폭 포함)
  const observe = useCallback((element: HTMLElement | null) => {
    if (!element) return
    setPanelWidth(element.getBoundingClientRect().width)
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(([entry]) => setPanelWidth(entry.contentRect.width))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  const split = !inDrawer && (size === 'full' || panelWidth >= SPLIT_MIN_PX)
  const diagramShown = diagramOpen || (!inDrawer && size === 'full')

  // 다른 곳(방금 호출 · 자동 시연 실패)에서 호출을 고르면 호출 탭으로, 보통 폭이면 잠깐 넓게
  const [seenSelected, setSeenSelected] = useState(selectedLogId)
  if (selectedLogId !== seenSelected) {
    setSeenSelected(selectedLogId)
    if (selectedLogId !== null) setTab('calls')
  }
  useEffect(() => {
    if (selectedLogId !== null && !inDrawer) widenForDetail(panelWidth)
    // 고를 때만 넓힌다 (폭이 바뀔 때마다 다시 부르지 않음)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLogId, inDrawer, widenForDetail])

  const closeDetail = () => {
    focusLog(null)
    if (!inDrawer) restoreAfterDetail()
  }
  const toggleSelect = (logId: number) => {
    if (logId === selectedLogId) closeDetail()
    else focusLog(logId)
  }

  // Esc: 상세 닫기 (입력 칸에서는 무시)
  useEffect(() => {
    if (selectedLogId === null) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      const target = event.target as HTMLElement | null
      if (target?.closest('input, textarea, select, [role="dialog"]')) return
      focusLog(null)
      if (!inDrawer) restoreAfterDetail()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedLogId, inDrawer, focusLog, restoreAfterDetail])

  const exportReport = () => {
    const report = buildReport(logs, changes)
    void navigator.clipboard?.writeText(report).catch(() => undefined)
    downloadText(
      `kidly-확인기록-${new Date().toISOString().slice(0, 16).replace(':', '')}.md`,
      report,
    )
  }

  const side = (
    <>
      {selected ? (
        <CallDetail log={selected} onClose={closeDetail} />
      ) : (
        spotlight && <LatestCallCard log={spotlight} onOpen={() => focusLog(spotlight.id)} />
      )}
      <button
        type="button"
        aria-expanded={diagramShown}
        onClick={() => setDiagramOpen((value) => !value)}
        className="text-muted-foreground hover:text-foreground text-xs"
      >
        {diagramShown ? '▾' : '▸'} 서버 이벤트 흐름도
      </button>
      {diagramShown && (
        <div className={cn(!split && 'max-h-[45vh] overflow-y-auto')}>
          <EventFlowDiagram timeline={timeline} />
        </div>
      )}
    </>
  )

  const tabs = (
    <div className="flex flex-wrap items-center gap-1 border-b px-2 py-1.5 text-xs">
      <TabButton active={tab === 'calls'} onClick={() => setTab('calls')}>
        호출 {presentation ? `${visibleLogs.length}/${logs.length}` : logs.length}
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
        <Button
          size="xs"
          variant={presentation ? 'default' : 'ghost'}
          aria-pressed={presentation}
          onClick={togglePresentation}
        >
          발표 모드
        </Button>
        <Button size="xs" variant="ghost" onClick={exportReport} disabled={logs.length === 0}>
          기록 내보내기
        </Button>
        <Button size="xs" variant="ghost" onClick={clear}>
          지우기
        </Button>
      </div>
    </div>
  )

  const content = (
    <div className="min-h-0 flex-1 overflow-y-auto p-2">
      {tab === 'calls' && (
        <CallList logs={visibleLogs} selectedLogId={selectedLogId} onSelect={toggleSelect} />
      )}
      {tab === 'changes' && <ChangeList changes={changes} />}
      {tab === 'contract' && <ContractList logs={contractLogs} />}
      {tab === 'mock' && <MockSettings />}
    </div>
  )

  return (
    <aside
      ref={observe}
      className={cn(
        'flex h-full min-h-0 flex-col border-l bg-white',
        // 발표 모드: 프로젝터에서도 읽히게 패널 전체를 키운다
        presentation && '[zoom:1.15]',
      )}
    >
      <div className="flex items-center gap-1 border-b px-2 py-1.5 text-xs">
        <span className="font-semibold">API 흐름</span>
        {!inDrawer && (
          <div role="group" aria-label="패널 폭" className="ml-auto flex gap-0.5">
            {SIZES.map((item) => (
              <button
                key={item.value}
                type="button"
                aria-pressed={size === item.value}
                title={item.title}
                onClick={() => setSize(item.value)}
                className={cn(
                  'rounded px-2 py-0.5',
                  size === item.value ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {split ? (
        <div className="flex min-h-0 flex-1">
          <div
            role="region"
            aria-label="호출 목록"
            className="flex min-h-0 basis-[52%] flex-col border-r"
          >
            {tabs}
            {content}
          </div>
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2">{side}</div>
        </div>
      ) : (
        <>
          <div className="max-h-[60%] shrink-0 space-y-2 overflow-y-auto border-b p-2">{side}</div>
          {tabs}
          {content}
        </>
      )}
    </aside>
  )
}

const SIZES: { value: Exclude<PanelSize, 'custom'>; label: string; title: string }[] = [
  { value: 'normal', label: '보통', title: '오른쪽에 좁게' },
  { value: 'wide', label: '◧ 넓게', title: '화면 절반' },
  { value: 'full', label: '⛶ 전체', title: 'API 흐름만 화면 가득' },
]

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
