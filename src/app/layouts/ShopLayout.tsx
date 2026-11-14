import { Link, matchPath, Outlet, useLocation } from 'react-router'
import { useUnreadCountStream, useUnreadNotificationCountQuery } from '@/entities/notification'
import { hasRole, useSessionStore } from '@/entities/session'
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
  const user = useSessionStore((state) => state.user)
  const accessToken = useSessionStore((state) => state.accessToken)
  const isBuyer = hasRole(user, 'BUYER')
  // 머리말 알림 배지: 레이아웃이 API를 부르는 예외 (AGENTS.md 2절)
  useUnreadNotificationCountQuery('member', isBuyer)
  useUnreadCountStream('member', isBuyer ? accessToken : null)
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
        <footer className="border-ink mt-16 border-t-[3px]">
          <div className="text-ink-2 mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-8 gap-y-3 px-4 pt-6 pb-20 text-[13px] md:px-6">
            <span className="font-logo text-ink text-[26px] leading-none">kidly</span>
            <p className="min-w-0 basis-full max-md:order-last md:flex-1 md:basis-0">
              키즈 패션 마켓 Kidly는 여러 판매자가 직접 상품을 올리고 파는 곳이에요. 팀
              블루블랙치킨고양이{demoRoleSwitch && ', 세미 프로젝트 시연용'}
            </p>
            <Link to={paths.center.apply} className="shop-link">
              판매자 입점
            </Link>
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
