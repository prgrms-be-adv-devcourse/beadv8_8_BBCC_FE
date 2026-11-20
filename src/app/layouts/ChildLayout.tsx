import type { ReactNode } from 'react'
import { Link, NavLink, Outlet, useMatch } from 'react-router'
import { useChildCartQuery } from '@/entities/cart'
import { useOwnChildProfileQuery } from '@/entities/child'
import { useChildOnboardingQuery } from '@/entities/child-onboarding'
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

type NavItem = { to: string; label: string; end?: boolean; icon?: ReactNode; isCart?: boolean }

const ICON = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  'aria-hidden': true,
} as const

const CLOSET: NavItem = {
  to: paths.child.home,
  label: '내 옷장',
  end: true,
  icon: (
    <svg {...ICON}>
      <path d="M4 21V5h16v16M4 13h16M12 5v8" />
    </svg>
  ),
}
const BROWSE: NavItem = {
  to: paths.child.products,
  label: '옷 구경',
  icon: (
    <svg {...ICON}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4-4" />
    </svg>
  ),
}
const CART: NavItem = {
  to: paths.child.cart,
  label: '장바구니',
  isCart: true,
  icon: (
    <svg {...ICON}>
      <path d="M5 8h14l-1 13H6zM9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  ),
}
const WISHES: NavItem = {
  to: paths.child.wishes,
  label: '조르기',
  icon: (
    <svg {...ICON}>
      <path d="M4 5h16v11H9l-5 4z" />
    </svg>
  ),
}
const FAVORITES: NavItem = { to: paths.child.favorites, label: '찜' }
const PURCHASES: NavItem = {
  to: paths.child.purchases,
  label: '사 준 옷',
  icon: (
    <svg {...ICON}>
      <path d="M4 10h16v11H4zM12 10v11M3 6h18v4H3zM12 6c-2-4-6-3-5 0M12 6c2-4 6-3 5 0" />
    </svg>
  ),
}

/** 넓은 화면 머리말 메뉴 */
const TOP_NAV = [CLOSET, BROWSE, CART, WISHES, FAVORITES, PURCHASES]
/** 휴대폰 아래 탭 (찜은 머리말 하트로 간다) */
const TAB_NAV = [CLOSET, BROWSE, CART, WISHES, PURCHASES]

/** 지금 화면 메뉴는 글자 아래쪽에 형광펜을 긋는다 (NavLink가 붙이는 .active) */
const MARKER_UNDERLINE = 'in-[.active]:bg-[linear-gradient(transparent_60%,var(--shop-marker)_60%)]'

/** 옷장 밖 화면(장바구니 · 조르기 · 상품 등)의 본문 폭과 여백. 내 옷장은 분홍 띠를 끝까지 깔려고 직접 잡는다 */
const PAGE = 'max-w-shop mx-auto w-full px-4 py-8 md:px-8 md:py-12'

function CountBadge({ count, className }: { count: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'figure flex h-5 min-w-5 items-center justify-center px-1 text-[11px] font-bold',
        className,
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}

/** 자녀 영역: 이름표 붙은 머리말 · 메뉴(휴대폰은 아래 탭) · 바닥글. 로그인 · 첫 안내 전에는 메뉴를 숨긴다 */
export function ChildLayout() {
  const accessToken = useChildSessionStore((state) => state.accessToken)
  const logout = useChildLogout()
  const isLoggedIn = !!accessToken
  // 머리말 알림 배지 · 이름표 · 장바구니 개수: 레이아웃이 API를 부르는 예외 (AGENTS.md 2절)
  const { data: unreadCount } = useUnreadNotificationCountQuery('child', isLoggedIn)
  useUnreadCountStream('child', accessToken)
  const onboarding = useChildOnboardingQuery({ enabled: isLoggedIn })
  const hasMenu = isLoggedIn && onboarding.data?.noticeConfirmed === true
  const profile = useOwnChildProfileQuery({ enabled: isLoggedIn })
  const cart = useChildCartQuery({ enabled: hasMenu })
  const cartCount = cart.data?.lines.length ?? 0
  const isHome = useMatch({ path: paths.child.home, end: true }) !== null
  const closetName = isLoggedIn && profile.data ? `${profile.data.name}의 옷장` : '자녀'

  const bell = (
    <NavLink
      to={paths.child.notifications}
      aria-label={unreadCount ? `알림 ${unreadCount}개 안 읽음` : '알림'}
      className="text-ink relative flex size-11 shrink-0 items-center justify-center"
    >
      <svg {...ICON}>
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" />
      </svg>
      {unreadCount ? (
        <CountBadge
          count={unreadCount}
          className="bg-sheet border-ink text-ink absolute top-1.5 right-0.5 h-[18px] min-w-[18px] border-[1.5px]"
        />
      ) : null}
    </NavLink>
  )

  return (
    <div className="bg-paper flex min-h-svh flex-col">
      <DemoBarWithFlowDrawer />
      <ScrollToTop />
      <div data-area="shop" className="shop-look flex flex-1 flex-col">
        <header className="bg-paper border-ink z-30 border-b-2 md:sticky md:top-0">
          <div className="max-w-shop mx-auto flex min-h-14 items-center gap-x-2 px-4 md:min-h-[76px] md:flex-wrap md:gap-x-4 md:px-8">
            <Link
              to={paths.child.home}
              aria-label="Kidly 내 옷장"
              className="text-ink flex shrink-0 items-center"
            >
              <KidlyLogo className="h-7 md:h-9" />
            </Link>
            <span
              data-clarity-mask="true"
              className="bg-marker border-ink font-hand inline-block min-w-0 -rotate-3 truncate border-[1.5px] px-2 text-base leading-snug font-bold md:max-w-none md:px-2.5 md:text-[19px]"
            >
              {closetName}
            </span>
            {hasMenu && (
              <>
                <nav
                  aria-label="자녀 메뉴"
                  className="ml-auto hidden flex-wrap items-center gap-0.5 md:flex"
                >
                  {TOP_NAV.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className="text-ink hover:bg-marker flex min-h-11 items-center gap-1.5 px-2 text-[15px] font-bold whitespace-nowrap lg:px-3"
                    >
                      <span className={MARKER_UNDERLINE}>{item.label}</span>
                      {item.isCart && cartCount > 0 && (
                        <>
                          <CountBadge count={cartCount} className="bg-ink text-paper" />
                          <span className="sr-only">{cartCount}개</span>
                        </>
                      )}
                    </NavLink>
                  ))}
                </nav>
                <div className="ml-auto flex shrink-0 items-center md:ml-0 md:gap-1">
                  <NavLink
                    to={paths.child.favorites}
                    aria-label="찜"
                    className="text-ink flex size-11 items-center justify-center md:hidden"
                  >
                    <svg {...ICON}>
                      <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
                    </svg>
                  </NavLink>
                  {bell}
                  <button
                    type="button"
                    disabled={logout.isPending}
                    onClick={() => logout.mutate()}
                    className="text-ink flex min-h-11 items-center px-1 text-[13px] font-bold underline underline-offset-[3px] disabled:opacity-50"
                  >
                    로그아웃
                  </button>
                </div>
              </>
            )}
            {isLoggedIn && !hasMenu && (
              <button
                type="button"
                disabled={logout.isPending}
                onClick={() => logout.mutate()}
                className="text-ink ml-auto flex min-h-11 items-center px-1 text-[13px] font-bold underline underline-offset-[3px] disabled:opacity-50"
              >
                로그아웃
              </button>
            )}
          </div>
        </header>
        <main className={cn('flex flex-1 flex-col', hasMenu && 'pb-16 md:pb-0')}>
          <ChildGate>
            {isHome ? (
              <Outlet />
            ) : (
              <div className={PAGE}>
                <Outlet />
              </div>
            )}
          </ChildGate>
        </main>
        <footer className={cn('border-ink border-t-2', hasMenu && 'mb-16 md:mb-0')}>
          <div className="text-ink-2 max-w-shop mx-auto flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-7 text-[13px] md:px-8">
            <KidlyLogo className="text-ink h-7" />
            <p className="min-w-0">
              키즈 패션 마켓 Kidly의 자녀 화면이에요. 고른 옷은 보호자에게 조르기로 보내요.
            </p>
          </div>
        </footer>
        {hasMenu && (
          <nav
            aria-label="자녀 아래 메뉴"
            className="bg-paper border-ink fixed inset-x-0 bottom-0 z-30 flex border-t-2 pb-[env(safe-area-inset-bottom)] md:hidden"
          >
            {TAB_NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'text-ink relative flex min-h-16 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-bold',
                    isActive && 'bg-marker',
                  )
                }
              >
                {item.icon}
                {item.label}
                {item.isCart && cartCount > 0 && (
                  <>
                    <CountBadge
                      count={cartCount}
                      className="bg-ink text-paper absolute top-1.5 left-1/2 ml-1.5 h-4 min-w-4 text-[10px]"
                    />
                    <span className="sr-only">{cartCount}개</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        )}
        {/* 확인 창 · 알림 띠도 쇼핑 영역의 색 · 모서리를 따르게 영역 안에 둔다 */}
        <Overlays />
      </div>
      <BehaviorRecording />
    </div>
  )
}
