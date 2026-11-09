import { Link, matchPath, Outlet, useLocation } from 'react-router'
import { ThemeLab } from '@/features/theme-lab'
import { paths, shopMasksWholePage, useDemoRoleSwitch } from '@/shared/config'
import { ShopHeader } from '@/widgets/shop-header'
import { DemoBarWithFlowDrawer } from './DemoBarWithFlowDrawer'
import { TopProgressBar } from './TopProgressBar'
import { SessionGate } from './SessionGate'
import { ShopLoginRedirect } from './ShopLoginRedirect'
import { BehaviorRecording } from './BehaviorRecording'
import { Overlays } from './Overlays'

/** 쇼핑(보호자): 일반 쇼핑몰 화면. API 흐름은 시연 막대의 버튼으로 연다 */
export function ShopLayout() {
  const demoRoleSwitch = useDemoRoleSwitch()
  const { pathname } = useLocation()
  return (
    <div className="bg-paper flex min-h-svh flex-col">
      <DemoBarWithFlowDrawer />
      <TopProgressBar />
      {/* 쇼핑 영역 색 · 글자 (shop.css의 data-area): 시연 막대는 빼고 머리말 · 본문 · 바닥글에만 */}
      <div data-area="shop" className="flex flex-1 flex-col">
        <ShopHeader />
        {/* 회원 정보 · 배송지 · 자녀 · 예치금 화면은 행동 분석 녹화에서 통째로 가린다 */}
        <main
          data-clarity-mask={shopMasksWholePage(pathname) || undefined}
          className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-6 md:py-8"
        >
          <SessionGate>
            <ShopLoginRedirect>
              <Outlet />
            </ShopLoginRedirect>
          </SessionGate>
        </main>
        <footer className="bg-paper-2 mt-10">
          <div className="text-ink-3 mx-auto max-w-6xl space-y-3 px-4 py-10 text-[13px] md:px-6">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <span className="text-ink-2 font-sans text-lg font-black tracking-tight">Kidly</span>
              <Link to={paths.center.apply} className="text-ink-2 hover:text-ink font-semibold">
                판매자 입점
              </Link>
            </div>
            <p>
              키즈 패션 마켓 Kidly는 여러 판매자가 직접 상품을 올리고 파는 곳이에요. 팀
              블루블랙치킨고양이{demoRoleSwitch && ', 세미 프로젝트 시연용'}
            </p>
          </div>
        </footer>
      </div>
      {/* 테마 바꿔 보기는 시연 기능. 상품 상세에서는 휴대폰 하단 담기 바를 가리지 않게 올린다 */}
      {demoRoleSwitch && <ThemeLab raised={matchPath('/products/:productId', pathname) !== null} />}
      <Overlays />
      <BehaviorRecording />
    </div>
  )
}
