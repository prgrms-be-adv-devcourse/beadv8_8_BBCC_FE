import { Outlet } from 'react-router'
import { ApiFlowPanel } from '@/widgets/api-flow-panel'
import { DemoBar } from '@/widgets/demo-bar'
import { DemoGuide, DemoStepBar } from '@/widgets/demo-step-bar'
import { SessionGate } from './SessionGate'

/** 시연 콘솔: 왼쪽은 단계별 화면, 오른쪽은 API 호출 흐름 (항상 펼침) */
export function ConsoleLayout() {
  return (
    <div className="flex h-svh flex-col">
      <DemoBar />
      <DemoStepBar />
      <div className="grid min-h-0 flex-1 grid-cols-[1fr_440px]">
        <main className="overflow-y-auto px-6 py-6">
          <div className="mx-auto max-w-3xl">
            <SessionGate>
              <DemoGuide />
              <Outlet />
            </SessionGate>
          </div>
        </main>
        <ApiFlowPanel />
      </div>
    </div>
  )
}
