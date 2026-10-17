import { Link, Outlet } from 'react-router'
import { ThemeLab } from '@/features/theme-lab'
import { paths, useDemoRoleSwitch } from '@/shared/config'
import { ShopHeader } from '@/widgets/shop-header'
import { DemoBarWithFlowDrawer } from './DemoBarWithFlowDrawer'
import { TopProgressBar } from './TopProgressBar'
import { SessionGate } from './SessionGate'
import { ShopLoginRedirect } from './ShopLoginRedirect'
import { Overlays } from './Overlays'

/** 쇼핑(보호자): 일반 쇼핑몰 화면. API 흐름은 시연 막대의 버튼으로 연다 */
export function ShopLayout() {
  const demoRoleSwitch = useDemoRoleSwitch()
  return (
    <div className="bg-background flex min-h-svh flex-col">
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
      <footer className="text-muted-foreground border-t py-6 text-xs">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 md:px-6">
          <span>Kidly · 팀 블루블랙치킨고양이{demoRoleSwitch && ' · 세미 프로젝트 시연용'}</span>
          <Link to={paths.center.apply} className="underline">
            판매자 입점
          </Link>
        </div>
      </footer>
      <ThemeLab />
      <Overlays />
    </div>
  )
}
