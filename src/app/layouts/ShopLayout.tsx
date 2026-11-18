import { Link, matchPath, Outlet, useLocation } from 'react-router'
import { useUnreadCountStream, useUnreadNotificationCountQuery } from '@/entities/notification'
import { hasRole, useSessionStore } from '@/entities/session'
import { ChatbotWidget } from '@/features/ask-chatbot'
import { loginPath, paths, shopMasksWholePage, useDemoRoleSwitch } from '@/shared/config'
import { KidlyLogo } from '@/shared/ui/KidlyLogo'
import { ShopHeader } from '@/widgets/shop-header'
import { DemoBarWithFlowDrawer } from './DemoBarWithFlowDrawer'
import { TopProgressBar } from './TopProgressBar'
import { SessionGate } from './SessionGate'
import { ShopLoginRedirect } from './ShopLoginRedirect'
import { BehaviorRecording } from './BehaviorRecording'
import { Overlays } from './Overlays'
import { ScrollToTop } from './ScrollToTop'

/** 쇼핑(보호자): 일반 쇼핑몰 화면. API 흐름은 시연 막대의 버튼으로 연다 */
export function ShopLayout() {
  const demoRoleSwitch = useDemoRoleSwitch()
  const { pathname } = useLocation()
  const user = useSessionStore((state) => state.user)
  const sessionStatus = useSessionStore((state) => state.status)
  const accessToken = useSessionStore((state) => state.accessToken)
  const isBuyer = hasRole(user, 'BUYER')
  const isProductDetail = matchPath('/products/:productId', pathname) !== null
  // 머리말 알림 배지: 레이아웃이 API를 부르는 예외 (AGENTS.md 2절)
  useUnreadNotificationCountQuery('member', isBuyer)
  useUnreadCountStream('member', isBuyer ? accessToken : null)
  return (
    <div className="bg-paper flex min-h-svh flex-col">
      <DemoBarWithFlowDrawer />
      <TopProgressBar />
      <ScrollToTop />
      {/* 쇼핑 영역 색 · 글자 (shop.css의 data-area): 시연 막대는 빼고 머리말 · 본문 · 바닥글에만 */}
      <div data-area="shop" className="flex flex-1 flex-col">
        <ShopHeader />
        {/* 회원 정보 · 배송지 · 자녀 · 예치금 화면은 행동 분석 녹화에서 통째로 가린다 */}
        <main
          data-clarity-mask={shopMasksWholePage(pathname) || undefined}
          className="max-w-shop mx-auto w-full flex-1 px-4 py-6 md:px-6 md:py-8"
        >
          <SessionGate>
            <ShopLoginRedirect>
              <Outlet />
            </ShopLoginRedirect>
          </SessionGate>
        </main>
        <footer className="border-ink mt-16 border-t-[3px]">
          <div className="text-ink-2 max-w-shop mx-auto flex flex-wrap items-center justify-between gap-x-8 gap-y-3 px-4 pt-6 pb-20 text-[13px] md:px-6">
            <KidlyLogo className="text-ink h-8" />
            <p className="min-w-0 basis-full max-md:order-last md:flex-1 md:basis-0">
              키즈 패션 마켓 Kidly는 여러 판매자가 직접 상품을 올리고 파는 곳이에요. 팀
              블루블랙치킨고양이{demoRoleSwitch && ', 세미 프로젝트 시연용'}
            </p>
            <Link to={paths.center.apply} className="shop-link">
              판매자 입점
            </Link>
          </div>
        </footer>
        {/* 챗봇: 회원 API라 로그인 회원이 바뀌면 대화를 새로 시작한다. 질문할 때만 API를 부른다 */}
        <ChatbotWidget
          key={user?.memberId ?? 'guest'}
          isSignedIn={user !== null}
          isRestoring={sessionStatus === 'restoring'}
          loginHref={loginPath(pathname)}
          productHref={(productId) => paths.shop.product(productId)}
          launcherInPage={isProductDetail}
        />
        {/* 확인 창 · 알림 띠도 쇼핑 영역의 색 · 모서리를 따르게 영역 안에 둔다 */}
        <Overlays />
      </div>
      <BehaviorRecording />
    </div>
  )
}
