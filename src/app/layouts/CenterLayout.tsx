import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { hasRole, ROLE_LABEL, useSessionStore } from '@/entities/session'
import { paths, useDemoRoleSwitch } from '@/shared/config'
import { cn } from '@/shared/lib'
import { DemoBarWithFlowDrawer } from './DemoBarWithFlowDrawer'
import { TopProgressBar } from './TopProgressBar'
import { SessionGate } from './SessionGate'
import { Overlays } from './Overlays'

/** 판매자 역할이 없어도 열 수 있는 화면 */
const OPEN_PATHS: string[] = [paths.center.apply]

/** 왼쪽 메뉴: 쇼핑 마이페이지 메뉴처럼 관심사별 두 묶음 */
const MENU = [
  {
    title: '판매',
    links: [
      { to: paths.center.home, label: '홈', end: true },
      // 상품 등록 · 상세(/center/products/…)는 따로 메뉴가 있어 상품 관리는 목록에서만 골라진다
      { to: paths.center.products, label: '상품 관리', end: true },
      { to: paths.center.productNew, label: '상품 등록', end: true },
      { to: paths.center.orders, label: '주문 · 배송' },
      { to: paths.center.settlements, label: '정산' },
    ],
  },
  {
    title: '상점',
    links: [
      { to: paths.center.store, label: '상점 정보', end: true },
      { to: paths.center.apply, label: '판매자 신청', end: true },
    ],
  },
]

function CenterMenu({ className }: { className?: string }) {
  return (
    <nav aria-label="판매자 센터 메뉴" className={className}>
      {/* 휴대폰: 본문 위 가로 한 줄 (넘치면 옆으로 민다). 넓은 화면: 묶음 제목이 있는 세로 메뉴 */}
      <div className="flex gap-x-5 overflow-x-auto whitespace-nowrap lg:block lg:space-y-7 lg:overflow-visible">
        {MENU.map((group) => (
          <div key={group.title} className="flex gap-x-5 lg:block lg:space-y-1.5">
            <p className="text-ink-3 text-[13px] font-semibold max-lg:hidden">{group.title}</p>
            <ul className="flex gap-x-5 lg:block">
              {group.links.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    end={link.end}
                    className={({ isActive }) =>
                      cn(
                        'hover:text-ink flex min-h-11 items-center text-[15px] transition-colors lg:min-h-0 lg:py-1.5',
                        isActive ? 'text-ink font-bold' : 'text-ink-2',
                      )
                    }
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  )
}

/** 판매자 센터: 쇼핑과 같은 흰 바탕 · 머리말, 왼쪽 묶음 메뉴(휴대폰은 위) + 업무 화면 */
export function CenterLayout() {
  const user = useSessionStore((state) => state.user)
  const { pathname } = useLocation()
  const blocked = !hasRole(user, 'SELLER') && !OPEN_PATHS.includes(pathname)
  const demoRoleSwitch = useDemoRoleSwitch()

  return (
    <div className="bg-paper flex min-h-svh flex-col">
      <DemoBarWithFlowDrawer />
      <TopProgressBar />
      {/* 판매자 센터 색 · 글자 (center.css의 data-area): 시연 막대는 빼고 머리말 · 본문에만 */}
      <div data-area="center" className="shop-look flex flex-1 flex-col">
        <header className="bg-paper border-rule z-30 border-b md:sticky md:top-0">
          <div className="mx-auto flex h-15 max-w-6xl items-center gap-3 px-4 md:h-17 md:px-6">
            <Link
              to={paths.center.home}
              aria-label="판매자 센터 홈"
              className="flex min-h-11 shrink-0 items-center gap-2.5"
            >
              <span className="text-signal font-sans text-[28px] leading-none font-black tracking-tight">
                Kidly
              </span>
              <span className="text-ink text-[17px] font-bold">판매자 센터</span>
            </Link>
            <Link
              to={paths.shop.home}
              className="text-ink-2 hover:text-ink ml-auto flex min-h-11 items-center text-[13px] font-semibold transition-colors"
            >
              쇼핑 홈
            </Link>
          </div>
        </header>
        {/* 휴대폰 한 칸도 minmax(0, 1fr): 가로 메뉴 줄의 폭만큼 칸이 늘어나 본문이 잘리지 않게.
            content-start: 메뉴가 가로 한 줄일 때 남는 높이를 줄 사이에 나눠 메뉴와 본문이 벌어지지 않게 */}
        <div className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-[minmax(0,1fr)] content-start items-start gap-6 px-4 py-6 md:px-6 md:py-8 lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-14">
          <CenterMenu className="border-rule max-lg:-mx-4 max-lg:border-b max-lg:px-4 lg:sticky lg:top-28" />
          <main className="min-w-0">
            <SessionGate>
              {blocked ? (
                <section className="border-rule max-w-xl space-y-2 rounded-lg border p-6">
                  <h1 className="text-section">
                    {ROLE_LABEL.SELLER} 계정으로 볼 수 있는 화면이에요.
                  </h1>
                  {demoRoleSwitch ? (
                    <p className="text-ink-2 text-[15px]">
                      위의 시연 역할에서 {ROLE_LABEL.SELLER}를 고르세요.
                    </p>
                  ) : (
                    <p className="text-ink-2 text-[15px]">
                      {ROLE_LABEL.SELLER} 계정으로{' '}
                      <Link to={paths.login} className="shop-link">
                        로그인
                      </Link>
                      하세요.
                    </p>
                  )}
                  <Link to={paths.center.apply} className="shop-link inline-block text-[15px]">
                    판매자 신청하러 가기
                  </Link>
                </section>
              ) : (
                <Outlet />
              )}
            </SessionGate>
          </main>
        </div>
      </div>
      <Overlays />
    </div>
  )
}
