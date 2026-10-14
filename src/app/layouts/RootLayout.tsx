import { Outlet } from 'react-router'
import { useSessionStore } from '@/entities/session'
import { ApiFlowPanel } from '@/widgets/api-flow-panel'
import { DemoStepBar } from '@/widgets/demo-step-bar'
import { Header } from '@/widgets/header'

/** 왼쪽은 화면, 오른쪽은 API 호출 흐름 (시연용 2단 구성) */
export function RootLayout() {
  // 세션 복원(재발급) 전에 화면이 토큰 없이 조회하지 않도록 기다린다
  const status = useSessionStore((state) => state.status)

  return (
    <div className="flex h-svh flex-col">
      <Header />
      <DemoStepBar />
      <div className="grid min-h-0 flex-1 grid-cols-[1fr_440px]">
        <main className="overflow-y-auto px-6 py-6">
          <div className="mx-auto max-w-3xl">
            {status === 'ready' ? (
              <Outlet />
            ) : (
              <p className="text-muted-foreground text-sm">로그인 확인 중…</p>
            )}
          </div>
        </main>
        <ApiFlowPanel />
      </div>
    </div>
  )
}
