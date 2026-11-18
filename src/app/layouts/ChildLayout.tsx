import { Link, NavLink, Outlet } from 'react-router'
import { useUnreadCountStream, useUnreadNotificationCountQuery } from '@/entities/notification'
import { useChildSessionStore } from '@/entities/session'
import { useChildLogout } from '@/features/logout'
import { paths } from '@/shared/config'
import { cn } from '@/shared/lib'
import { KidlyLogo } from '@/shared/ui/KidlyLogo'
import { ChildGate } from './ChildGate'
import { DemoBarWithFlowDrawer } from './DemoBarWithFlowDrawer'
import { BehaviorRecording } from './BehaviorRecording'
import { Overlays } from './Overlays'
import { ScrollToTop } from './ScrollToTop'

/** 머리말 자녀 메뉴: 쇼핑 머리말 바로가기와 같은 글자 · 밑줄, 지금 화면은 굵은 밑줄 */
const NAV = [
  { to: paths.child.home, label: '내 프로필', end: true },
  { to: paths.child.products, label: '상품' },
  { to: paths.child.cart, label: '내 장바구니' },
  { to: paths.child.wishes, label: '내 조르기' },
  { to: paths.child.favorites, label: '내 찜' },
  { to: paths.child.purchases, label: '나를 위해 산 것' },
] as const

const NAV_LINK =
  'text-ink flex min-h-11 shrink-0 items-center gap-1 px-2 text-[13px] font-semibold whitespace-nowrap underline-offset-4 hover:underline active:translate-y-px'

const ACCOUNT_BOX =
  'border-ink text-ink hover:bg-marker flex h-8 items-center border-[1.5px] px-3 text-[13px] font-bold whitespace-nowrap transition-colors'

/** 자녀 영역: 쇼핑 화면과 같은 바탕 · 머리말 틀 · 바닥글. 로그인 전에는 자녀 메뉴를 숨긴다 */
export function ChildLayout() {
  const accessToken = useChildSessionStore((state) => state.accessToken)
  const logout = useChildLogout()
  // 머리말 알림 배지: 레이아웃이 API를 부르는 예외 (AGENTS.md 2절)
  const { data: unreadCount } = useUnreadNotificationCountQuery('child', !!accessToken)
  useUnreadCountStream('child', accessToken)
  return (
    <div className="bg-paper flex min-h-svh flex-col">
      <DemoBarWithFlowDrawer />
      <ScrollToTop />
      <div data-area="shop" className="shop-look flex flex-1 flex-col">
        <header className="bg-paper border-ink z-30 border-b-[1.5px] md:sticky md:top-0">
          <div className="max-w-shop mx-auto flex flex-wrap items-center gap-x-6 gap-y-1 px-4 py-3 md:h-17 md:flex-nowrap md:px-6 md:py-0">
            <Link
              to={paths.child.home}
              aria-label="Kidly 자녀"
              className="text-ink flex shrink-0 items-center gap-2"
            >
              <KidlyLogo className="h-8 md:h-10" />
              <span className="border-ink font-label border-[1.5px] px-1.5 text-xs font-bold">
                자녀
              </span>
            </Link>
            {accessToken && (
              <>
                {/* 휴대폰은 메뉴를 아래 줄로 내려 옆으로 넘긴다 */}
                <nav
                  aria-label="자녀 메뉴"
                  className="order-last -mx-2 flex basis-full overflow-x-auto md:order-none md:ml-auto md:basis-auto"
                >
                  {NAV.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={'end' in item}
                      className={({ isActive }) =>
                        cn(NAV_LINK, isActive && 'underline decoration-2')
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                  <NavLink
                    to={paths.child.notifications}
                    aria-label={unreadCount ? `알림 ${unreadCount}개 안 읽음` : '알림'}
                    className={({ isActive }) => cn(NAV_LINK, isActive && 'underline decoration-2')}
                  >
                    알림
                    {unreadCount ? (
                      <span
                        aria-hidden
                        className="bg-ink text-paper font-label flex h-[18px] min-w-[18px] items-center justify-center px-1 text-xs font-bold"
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    ) : null}
                  </NavLink>
                </nav>
                <button
                  type="button"
                  disabled={logout.isPending}
                  onClick={() => logout.mutate()}
                  className="ml-auto flex min-h-11 items-center disabled:opacity-50 md:ml-0"
                >
                  <span className={ACCOUNT_BOX}>로그아웃</span>
                </button>
              </>
            )}
          </div>
        </header>
        <main className="max-w-shop mx-auto w-full flex-1 px-4 py-6 md:px-6 md:py-8">
          <ChildGate>
            <Outlet />
          </ChildGate>
        </main>
        <footer className="border-ink mt-16 border-t-[3px]">
          <div className="text-ink-2 max-w-shop mx-auto flex flex-wrap items-center justify-between gap-x-8 gap-y-3 px-4 pt-6 pb-10 text-[13px] md:px-6">
            <KidlyLogo className="text-ink h-8" />
            <p className="min-w-0 basis-full max-md:order-last md:flex-1 md:basis-0">
              키즈 패션 마켓 Kidly의 자녀 화면이에요. 고른 옷은 보호자에게 조르기로 보내요.
            </p>
          </div>
        </footer>
        {/* 확인 창 · 알림 띠도 쇼핑 영역의 색 · 모서리를 따르게 영역 안에 둔다 */}
        <Overlays />
      </div>
      <BehaviorRecording />
    </div>
  )
}
