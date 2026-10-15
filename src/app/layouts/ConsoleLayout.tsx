import { Outlet } from 'react-router'
import { cn } from '@/shared/lib'
import { ApiFlowPanel, usePresentationMode } from '@/widgets/api-flow-panel'
import { AutoDemoBar } from '@/widgets/auto-demo'
import { DemoBar } from '@/widgets/demo-bar'
import { TopProgressBar } from './TopProgressBar'
import { DemoGuide, DemoStepBar } from '@/widgets/demo-step-bar'
import { SessionGate } from './SessionGate'

/** 시연 콘솔: 왼쪽은 단계별 화면, 오른쪽은 API 호출 흐름 (항상 펼침) */
export function ConsoleLayout() {
  const presentation = usePresentationMode((state) => state.on)
  return (
    <div className="flex h-svh flex-col">
      <DemoBar />
      <TopProgressBar />
      <DemoStepBar />
      <div
        className={cn(
          'grid min-h-0 flex-1',
          presentation ? 'grid-cols-[1fr_560px]' : 'grid-cols-[1fr_440px]',
        )}
      >
        <div className="flex min-h-0 flex-col">
          <main className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
            <div className="mx-auto max-w-3xl">
              <SessionGate>
                <DemoGuide />
                <Outlet />
              </SessionGate>
            </div>
          </main>
          <AutoDemoBar />
        </div>
        <ApiFlowPanel />
      </div>
    </div>
  )
}
