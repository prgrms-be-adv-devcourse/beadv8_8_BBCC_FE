import { Outlet } from 'react-router'
import { ShopHeader } from '@/widgets/shop-header'
import { DemoBarWithFlowDrawer } from './DemoBarWithFlowDrawer'
import { TopProgressBar } from './TopProgressBar'
import { SessionGate } from './SessionGate'
import { ShopLoginRedirect } from './ShopLoginRedirect'

/** 쇼핑(보호자): 일반 쇼핑몰 화면. API 흐름은 시연 막대의 버튼으로 연다 */
export function ShopLayout() {
  return (
    <div className="bg-muted/30 flex min-h-svh flex-col">
      <DemoBarWithFlowDrawer />
      <TopProgressBar />
      <ShopHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-6 md:py-8">
        <SessionGate>
          <ShopLoginRedirect>
            <Outlet />
          </ShopLoginRedirect>
        </SessionGate>
      </main>
      <footer className="text-muted-foreground border-t bg-white py-6 text-center text-xs">
        Kidly · 팀 블루블랙치킨고양이 · 세미 프로젝트 시연용
      </footer>
    </div>
  )
}
