import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'
import { cn } from '@/shared/lib'
import { useApiFlowLog } from '@/shared/api'
import { ApiFlowPanel, usePanelSize, usePresentationMode } from '@/widgets/api-flow-panel'
import { AutoDemoBar } from '@/widgets/auto-demo'
import { DemoBar } from '@/widgets/demo-bar'
import { TopProgressBar } from './TopProgressBar'
import { DemoGuide, DemoStepBar, findDemoGuide } from '@/widgets/demo-step-bar'
import { SessionGate } from './SessionGate'
import { Overlays } from './Overlays'

/** 시연 콘솔: 왼쪽은 단계별 화면, 오른쪽은 API 호출 흐름 (항상 펼침) */
export function ConsoleLayout() {
  const presentation = usePresentationMode((state) => state.on)
  const size = usePanelSize((state) => state.size)
  const { pathname } = useLocation()
  // 호출 기록에 시연 단계(①~⑦)를 붙인다 → 흐름 패널이 단계별로 묶음
  const setCurrentStep = useApiFlowLog((state) => state.setCurrentStep)
  useEffect(() => {
    setCurrentStep(findDemoGuide(pathname)?.step ?? null)
  }, [pathname, setCurrentStep])
  useEffect(() => () => setCurrentStep(null), [setCurrentStep])
  return (
    <div className="flex h-svh flex-col">
      <DemoBar />
      <TopProgressBar />
      <DemoStepBar />
      <div
        className={cn(
          'grid min-h-0 flex-1',
          size === 'full'
            ? 'grid-cols-[0_1fr]'
            : size === 'wide'
              ? 'grid-cols-[1fr_1fr]'
              : presentation
                ? 'grid-cols-[1fr_560px]'
                : 'grid-cols-[1fr_440px]',
        )}
      >
        <div
          className={cn('flex min-h-0 flex-col', size === 'full' && 'invisible overflow-hidden')}
        >
          <main className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
            <div className="mx-auto max-w-3xl">
              <SessionGate>
                <DemoGuide />
                <Outlet />
              </SessionGate>
            </div>
          </main>
        </div>
        <ApiFlowPanel />
      </div>
      {/* 자동 시연 막대는 패널 폭(전체 포함)과 상관없이 맨 아래에 */}
      <AutoDemoBar />
      <Overlays />
    </div>
  )
}
